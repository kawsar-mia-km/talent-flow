const express = require("express");
const {
  getAllUsers,
  toggleUserStatus,
  getPlatformStats,
  exportMyData,
  deleteMyAccount,
  updateMySkills
} = require("../controllers/userController");
const { getMyProfile, updateMyProfile, generateResumePdf } = require("../controllers/candidateProfileController");
const { listAuditLog } = require("../controllers/auditLogController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, authorize("admin"), getAllUsers);
router.get("/stats", protect, authorize("admin"), getPlatformStats);
router.get("/audit-log", protect, authorize("admin"), listAuditLog);
router.patch("/:id/toggle-status", protect, authorize("admin"), toggleUserStatus);

// Self-service account management (GDPR-style export/delete + candidate skills profile).
router.get("/me/export", protect, exportMyData);
router.delete("/me", protect, deleteMyAccount);
router.patch("/me/skills", protect, authorize("candidate"), updateMySkills);

// CV / resume builder (candidate only).
router.get("/me/profile", protect, authorize("candidate"), getMyProfile);
router.put("/me/profile", protect, authorize("candidate"), updateMyProfile);
router.get("/me/resume.pdf", protect, authorize("candidate"), generateResumePdf);

module.exports = router;
