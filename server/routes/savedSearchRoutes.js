const express = require("express");
const { listMySavedSearches, createSavedSearch, deleteSavedSearch } = require("../controllers/savedSearchController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, authorize("candidate"), listMySavedSearches);
router.post("/", protect, authorize("candidate"), createSavedSearch);
router.delete("/:id", protect, authorize("candidate"), deleteSavedSearch);

module.exports = router;
