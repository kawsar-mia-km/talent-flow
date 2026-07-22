require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");
const Job = require("./models/Job");
const Application = require("./models/Application");
const Notification = require("./models/Notification");

async function seed() {
  await connectDB();
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    Notification.deleteMany({})
  ]);

  console.log("Creating demo users...");
  const admin = await User.create({
    name: "Sarah Miller",
    email: "admin@talentflow.com",
    password: "admin123",
    role: "admin"
  });
  const recruiter = await User.create({
    name: "Nick Thompson",
    email: "recruiter@talentflow.com",
    password: "recruit123",
    role: "recruiter",
    companyName: "ABC Tech"
  });
  await User.create({
    name: "John Doe",
    email: "candidate@talentflow.com",
    password: "candidate123",
    role: "candidate"
  });

  console.log("Creating demo jobs...");
  await Job.create([
    {
      title: "Software Engineer",
      company: "ABC Tech",
      requiredSkills: ["Python", "React", "SQL", "Java"],
      experience: "3+ years",
      description: "Build and ship product features across the stack.",
      recruiter: recruiter._id
    },
    {
      title: "Data Analyst",
      company: "ABC Tech",
      requiredSkills: ["SQL", "Excel", "Python", "Power BI"],
      experience: "2+ years",
      description: "Turn raw data into hiring and revenue insight.",
      recruiter: recruiter._id
    },
    {
      title: "Marketing Specialist",
      company: "ABC Tech",
      requiredSkills: ["SEO", "Content", "Analytics"],
      experience: "1+ years",
      description: "Own campaigns end to end, from brief to report.",
      recruiter: recruiter._id
    }
  ]);

  console.log("Seed complete. Demo logins:");
  console.log("  admin@talentflow.com / admin123");
  console.log("  recruiter@talentflow.com / recruit123");
  console.log("  candidate@talentflow.com / candidate123");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
