const express = require("express");
const multer = require("multer");
const path = require("path");
const { runFairnessAudit } = require("../controllers/fairnessController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

function csvOnlyFilter(req, file, cb) {
  if (path.extname(file.originalname).toLowerCase() !== ".csv") {
    return cb(new Error("Please upload a .csv file."));
  }
  cb(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvOnlyFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

function handleUpload(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "There was a problem with your file." });
    next();
  });
}

router.post("/audit", protect, authorize("admin"), handleUpload, runFairnessAudit);

module.exports = router;
