const SavedSearch = require("../models/SavedSearch");

async function listMySavedSearches(req, res, next) {
  try {
    const searches = await SavedSearch.find({ candidate: req.user._id }).sort({ createdAt: -1 });
    res.json({ savedSearches: searches });
  } catch (err) {
    next(err);
  }
}

async function createSavedSearch(req, res, next) {
  try {
    const { label, query, skills } = req.body;
    if (!query && !(skills || []).length) {
      return res.status(400).json({ message: "Provide a search query or at least one skill to match on." });
    }
    const search = await SavedSearch.create({
      candidate: req.user._id,
      label: label || query || (skills || []).join(", "),
      query: query || "",
      skills: skills || []
    });
    res.status(201).json({ savedSearch: search });
  } catch (err) {
    next(err);
  }
}

async function deleteSavedSearch(req, res, next) {
  try {
    const search = await SavedSearch.findById(req.params.id);
    if (!search) return res.status(404).json({ message: "Saved search not found." });
    if (String(search.candidate) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own saved searches." });
    }
    await search.deleteOne();
    res.json({ message: "Saved search removed." });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMySavedSearches, createSavedSearch, deleteSavedSearch };
