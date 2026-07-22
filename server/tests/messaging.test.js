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

async function createApplication() {
  const recruiter = await registerAndLogin({ role: "recruiter", companyName: "Acme Inc" });
  const candidate = await registerAndLogin({ role: "candidate" });

  const jobRes = await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${recruiter.token}`)
    .send({ title: "Backend Engineer", requiredSkills: "Node.js" });

  const appRes = await request(app)
    .post("/api/applications")
    .set("Authorization", `Bearer ${candidate.token}`)
    .field("jobId", jobRes.body.job._id);

  return { recruiter, candidate, job: jobRes.body.job, application: appRes.body.application };
}

describe("In-app messaging", () => {
  it("lets the candidate and the hiring recruiter exchange messages", async () => {
    const { recruiter, candidate, application } = await createApplication();

    const sendRes = await request(app)
      .post(`/api/applications/${application._id}/messages`)
      .set("Authorization", `Bearer ${candidate.token}`)
      .send({ body: "Hi, excited about this role!" });
    expect(sendRes.status).toBe(201);

    const replyRes = await request(app)
      .post(`/api/applications/${application._id}/messages`)
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ body: "Thanks for applying — let's chat." });
    expect(replyRes.status).toBe(201);

    const threadRes = await request(app)
      .get(`/api/applications/${application._id}/messages`)
      .set("Authorization", `Bearer ${candidate.token}`);
    expect(threadRes.status).toBe(200);
    expect(threadRes.body.messages).toHaveLength(2);
  });

  it("blocks a stranger from reading or sending messages on someone else's application", async () => {
    const { application } = await createApplication();
    const stranger = await registerAndLogin({ role: "candidate" });

    const readRes = await request(app)
      .get(`/api/applications/${application._id}/messages`)
      .set("Authorization", `Bearer ${stranger.token}`);
    expect(readRes.status).toBe(403);

    const sendRes = await request(app)
      .post(`/api/applications/${application._id}/messages`)
      .set("Authorization", `Bearer ${stranger.token}`)
      .send({ body: "Let me in!" });
    expect(sendRes.status).toBe(403);
  });

  it("rejects an empty message body", async () => {
    const { candidate, application } = await createApplication();
    const res = await request(app)
      .post(`/api/applications/${application._id}/messages`)
      .set("Authorization", `Bearer ${candidate.token}`)
      .send({ body: "   " });
    expect(res.status).toBe(400);
  });
});

describe("Internal recruiter notes", () => {
  it("lets a recruiter add and read internal notes on their own applicant", async () => {
    const { recruiter, application } = await createApplication();

    const addRes = await request(app)
      .post(`/api/applications/${application._id}/notes`)
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ body: "Strong communicator, move to next round." });
    expect(addRes.status).toBe(201);

    const listRes = await request(app)
      .get(`/api/applications/${application._id}/notes`)
      .set("Authorization", `Bearer ${recruiter.token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.notes).toHaveLength(1);
  });

  it("never exposes internal notes to the candidate — the route is recruiter/admin only", async () => {
    const { candidate, application } = await createApplication();
    const res = await request(app)
      .get(`/api/applications/${application._id}/notes`)
      .set("Authorization", `Bearer ${candidate.token}`);
    expect(res.status).toBe(403);
  });

  it("blocks a recruiter from a different company from reading notes", async () => {
    const { application } = await createApplication();
    const outsider = await registerAndLogin({ role: "recruiter", companyName: "Other Co" });

    const res = await request(app)
      .get(`/api/applications/${application._id}/notes`)
      .set("Authorization", `Bearer ${outsider.token}`);
    expect(res.status).toBe(403);
  });
});
