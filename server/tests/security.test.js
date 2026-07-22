const request = require("supertest");
const { authenticator } = require("otplib");
const createApp = require("../app");

const app = createApp();

const user = {
  name: "Grace Hopper",
  email: "grace@example.com",
  password: "supersecret",
  role: "candidate"
};

describe("Account lockout", () => {
  it("locks the account after 5 consecutive failed logins", async () => {
    await request(app).post("/api/auth/register").send(user);

    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/auth/login").send({ email: user.email, password: "wrong-password" });
    }

    const res = await request(app).post("/api/auth/login").send({ email: user.email, password: user.password });
    expect(res.status).toBe(423);
  });

  it("resets the failure counter after a successful login", async () => {
    await request(app).post("/api/auth/register").send({ ...user, email: "reset@example.com" });

    await request(app).post("/api/auth/login").send({ email: "reset@example.com", password: "wrong-password" });
    await request(app).post("/api/auth/login").send({ email: "reset@example.com", password: "wrong-password" });

    const ok = await request(app).post("/api/auth/login").send({ email: "reset@example.com", password: user.password });
    expect(ok.status).toBe(200);

    // Two more wrong attempts shouldn't be enough to lock (counter reset by the success above).
    await request(app).post("/api/auth/login").send({ email: "reset@example.com", password: "wrong-password" });
    const res = await request(app).post("/api/auth/login").send({ email: "reset@example.com", password: "wrong-password" });
    expect(res.status).toBe(401);
  });
});

describe("Two-factor authentication", () => {
  async function registerAndLogin(email) {
    const res = await request(app).post("/api/auth/register").send({ ...user, email });
    return res.body.token;
  }

  it("lets a logged-in user enroll in 2FA and requires it on next login", async () => {
    const email = "twofactor@example.com";
    const token = await registerAndLogin(email);

    const setupRes = await request(app).post("/api/auth/2fa/setup").set("Authorization", `Bearer ${token}`);
    expect(setupRes.status).toBe(200);
    expect(setupRes.body.secret).toEqual(expect.any(String));

    const validCode = authenticator.generate(setupRes.body.secret);
    const verifyRes = await request(app)
      .post("/api/auth/2fa/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: validCode });
    expect(verifyRes.status).toBe(200);

    // Next login should now require a second factor instead of returning a session directly.
    const loginRes = await request(app).post("/api/auth/login").send({ email, password: user.password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.twoFactorRequired).toBe(true);
    expect(loginRes.body.twoFactorToken).toEqual(expect.any(String));
  });

  it("completes login with a valid TOTP code and rejects an invalid one", async () => {
    const email = "twofactor2@example.com";
    const token = await registerAndLogin(email);

    const setupRes = await request(app).post("/api/auth/2fa/setup").set("Authorization", `Bearer ${token}`);
    const secret = setupRes.body.secret;
    await request(app)
      .post("/api/auth/2fa/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: authenticator.generate(secret) });

    const loginRes = await request(app).post("/api/auth/login").send({ email, password: user.password });
    const { twoFactorToken } = loginRes.body;

    const badAttempt = await request(app)
      .post("/api/auth/2fa/verify-login")
      .send({ twoFactorToken, code: "000000" });
    expect(badAttempt.status).toBe(401);

    const goodAttempt = await request(app)
      .post("/api/auth/2fa/verify-login")
      .send({ twoFactorToken, code: authenticator.generate(secret) });
    expect(goodAttempt.status).toBe(200);
    expect(goodAttempt.body.token).toEqual(expect.any(String));
  });

  it("lets a user disable 2FA with their password", async () => {
    const email = "twofactor3@example.com";
    const token = await registerAndLogin(email);

    const setupRes = await request(app).post("/api/auth/2fa/setup").set("Authorization", `Bearer ${token}`);
    await request(app)
      .post("/api/auth/2fa/verify")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: authenticator.generate(setupRes.body.secret) });

    const disableRes = await request(app)
      .post("/api/auth/2fa/disable")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: user.password });
    expect(disableRes.status).toBe(200);

    const loginRes = await request(app).post("/api/auth/login").send({ email, password: user.password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.twoFactorRequired).toBeUndefined();
  });
});
