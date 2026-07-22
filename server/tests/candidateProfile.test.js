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

describe("CV / profile builder", () => {
  it("creates an empty profile on first fetch", async () => {
    const { token } = await registerAndLogin();
    const res = await request(app).get("/api/users/me/profile").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.experience).toEqual([]);
  });

  it("updates profile fields and persists them", async () => {
    const { token } = await registerAndLogin();
    const res = await request(app)
      .put("/api/users/me/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        headline: "Backend Engineer",
        summary: "Experienced Node.js developer.",
        experience: [{ title: "Engineer", company: "Acme", current: true }]
      });
    expect(res.status).toBe(200);
    expect(res.body.profile.headline).toBe("Backend Engineer");
    expect(res.body.profile.experience).toHaveLength(1);
  });

  it("refuses to generate a PDF for a mostly-empty profile", async () => {
    const { token } = await registerAndLogin();
    const res = await request(app).get("/api/users/me/resume.pdf").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("generates a PDF once the profile has enough content", async () => {
    const { token } = await registerAndLogin();
    await request(app)
      .put("/api/users/me/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        headline: "Backend Engineer",
        summary: "Experienced Node.js developer.",
        experience: [{ title: "Engineer", company: "Acme", current: true }],
        education: [{ school: "State University", degree: "BSc" }],
        links: { github: "https://github.com/example" }
      });

    const res = await request(app).get("/api/users/me/resume.pdf").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
  });
});

describe("Job prep guide", () => {
  async function createJobAsRecruiter() {
    const recruiter = await registerAndLogin({ role: "recruiter", companyName: "Acme Inc" });
    const jobRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${recruiter.token}`)
      .send({ title: "Backend Engineer", requiredSkills: "Node.js, MongoDB, Docker, Kubernetes" });
    return jobRes.body.job;
  }

  it("computes matched vs missing skills against the candidate's profile", async () => {
    const job = await createJobAsRecruiter();
    const { token } = await registerAndLogin();

    await request(app)
      .patch("/api/users/me/skills")
      .set("Authorization", `Bearer ${token}`)
      .send({ skills: ["Node.js", "MongoDB"] });

    const res = await request(app).get(`/api/jobs/${job._id}/prep-guide`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.skillGap.matchedCount).toBe(2);
    expect(res.body.skillGap.totalRequired).toBe(4);
    expect(res.body.skillGap.missingSkills.sort()).toEqual(["Docker", "Kubernetes"].sort());
  });

  it("includes curated resources for a known skill and a fallback for an unknown one", async () => {
    const job = await createJobAsRecruiter();
    const { token } = await registerAndLogin();

    const res = await request(app).get(`/api/jobs/${job._id}/prep-guide`).set("Authorization", `Bearer ${token}`);
    const dockerGuide = res.body.skillGuides.find((g) => g.skill === "Docker");
    expect(dockerGuide.resources.length).toBeGreaterThan(0);
    expect(dockerGuide.topics.length).toBeGreaterThan(0);
  });

  it("nudges an incomplete profile and flags a complete one as fine", async () => {
    const job = await createJobAsRecruiter();
    const { token } = await registerAndLogin();

    const incomplete = await request(app).get(`/api/jobs/${job._id}/prep-guide`).set("Authorization", `Bearer ${token}`);
    expect(incomplete.body.cvCompleteness).toBeLessThan(60);
    expect(incomplete.body.checklist.some((c) => c.includes("incomplete"))).toBe(true);
  });

  it("only candidates can access the prep guide", async () => {
    const job = await createJobAsRecruiter();
    const recruiter2 = await registerAndLogin({ role: "recruiter", companyName: "Other Co" });
    const res = await request(app).get(`/api/jobs/${job._id}/prep-guide`).set("Authorization", `Bearer ${recruiter2.token}`);
    expect(res.status).toBe(403);
  });
});
