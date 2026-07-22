const request = require("supertest");
const createApp = require("../app");

const app = createApp();

async function registerAndLogin(overrides = {}) {
  const user = {
    name: "Test User",
    email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: "supersecret",
    role: "candidate",
    ...overrides
  };
  const res = await request(app).post("/api/auth/register").send(user);
  return { token: res.body.token, user: res.body.user };
}

const validJob = {
  title: "Senior Backend Engineer",
  requiredSkills: "Node.js, MongoDB, Docker",
  experience: "3-5 years",
  description: "Build and scale our platform."
};

describe("POST /api/jobs", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/jobs").send(validJob);
    expect(res.status).toBe(401);
  });

  it("rejects candidates trying to post a job (role-based access control)", async () => {
    const { token } = await registerAndLogin({ role: "candidate" });
    const res = await request(app).post("/api/jobs").set("Authorization", `Bearer ${token}`).send(validJob);
    expect(res.status).toBe(403);
  });

  it("lets a recruiter create a job posting", async () => {
    const { token } = await registerAndLogin({ role: "recruiter", companyName: "Acme Inc" });
    const res = await request(app).post("/api/jobs").set("Authorization", `Bearer ${token}`).send(validJob);

    expect(res.status).toBe(201);
    expect(res.body.job).toMatchObject({
      title: validJob.title,
      company: "Acme Inc",
      status: "open"
    });
    expect(res.body.job.requiredSkills).toEqual(["Node.js", "MongoDB", "Docker"]);
  });

  it("rejects a job with no title", async () => {
    const { token } = await registerAndLogin({ role: "recruiter" });
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...validJob, title: "" });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/jobs/:id", () => {
  it("prevents a recruiter from editing another recruiter's job", async () => {
    const owner = await registerAndLogin({ role: "recruiter", companyName: "Owner Co" });
    const intruder = await registerAndLogin({ role: "recruiter", companyName: "Intruder Co" });

    const createRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(validJob);
    const jobId = createRes.body.job._id;

    const res = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${intruder.token}`)
      .send({ status: "closed" });

    expect(res.status).toBe(403);
  });

  it("lets the owning recruiter close their job", async () => {
    const owner = await registerAndLogin({ role: "recruiter", companyName: "Owner Co" });
    const createRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${owner.token}`)
      .send(validJob);
    const jobId = createRes.body.job._id;

    const res = await request(app)
      .patch(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ status: "closed" });

    expect(res.status).toBe(200);
    expect(res.body.job.status).toBe("closed");
  });
});

describe("GET /api/jobs", () => {
  it("is public and only returns open jobs", async () => {
    const recruiter = await registerAndLogin({ role: "recruiter", companyName: "Acme" });
    const openJob = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send(validJob);
    const closedJobRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ ...validJob, title: "Closed Role" });
    await request(app)
      .patch(`/api/jobs/${closedJobRes.body.job._id}`)
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ status: "closed" });

    const res = await request(app).get("/api/jobs");

    expect(res.status).toBe(200);
    const ids = res.body.jobs.map((j) => j._id);
    expect(ids).toContain(openJob.body.job._id);
    expect(ids).not.toContain(closedJobRes.body.job._id);
  });
});
