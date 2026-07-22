const request = require("supertest");
const createApp = require("../app");
const User = require("../models/User");

const app = createApp();

const candidate = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "supersecret",
  role: "candidate"
};

describe("POST /api/auth/register", () => {
  it("creates a new account and returns an access token + safe user object", async () => {
    const res = await request(app).post("/api/auth/register").send(candidate);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: "ada@example.com", role: "candidate" });
    expect(res.body.user.password).toBeUndefined();

    // Password must be hashed at rest, never stored in plaintext.
    const stored = await User.findOne({ email: "ada@example.com" }).select("+password");
    expect(stored.password).not.toBe(candidate.password);
  });

  it("rejects duplicate emails with 409", async () => {
    await request(app).post("/api/auth/register").send(candidate);
    const res = await request(app).post("/api/auth/register").send(candidate);

    expect(res.status).toBe(409);
  });

  it("rejects an invalid email with a 400 validation error", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...candidate, email: "not-an-email" });

    expect(res.status).toBe(400);
  });

  it("rejects a password shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...candidate, email: "short@example.com", password: "123" });

    expect(res.status).toBe(400);
  });

  it("defaults an unrecognized role to candidate instead of trusting client input", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...candidate, email: "admin-attempt@example.com", role: "admin" });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("candidate");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(candidate);
  });

  it("logs in with correct credentials and sets a refresh-token cookie", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: candidate.email, password: candidate.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects a wrong password with 401 and a generic message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: candidate.email, password: "wrongpassword" });

    expect(res.status).toBe(401);
    // Message shouldn't reveal whether it was the email or password that
    // was wrong (helps avoid user-enumeration).
    expect(res.body.message).toMatch(/doesn't match/i);
  });

  it("rejects a login for an email that was never registered", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ghost@example.com", password: "whatever1" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 when no Authorization header is sent", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user when a valid access token is sent", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(candidate);
    const token = registerRes.body.token;

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(candidate.email);
  });
});

describe("POST /api/auth/refresh + logout", () => {
  it("rotates the refresh token and issues a new access token", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(candidate);

    const refreshRes = await agent.post("/api/auth/refresh");
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.token).toEqual(expect.any(String));
  });

  it("invalidates the session on logout so refresh no longer works", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(candidate);
    await agent.post("/api/auth/logout");

    const refreshRes = await agent.post("/api/auth/refresh");
    expect(refreshRes.status).toBe(401);
  });

  it("returns 401 when refreshing with no cookie at all", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });
});
