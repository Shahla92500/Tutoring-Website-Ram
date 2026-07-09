// routes/alumniRouter.js
const express = require("express");
const router = express.Router();
const { getSessions, getQuickStats } = require("../controllers/alumniController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware);

// GET /alumni/sessions - Get alumni's sessions
router.get("/sessions", getSessions);

// GET /alumni/quick-stats - Get alumni's quick stats
router.get("/quick-stats", getQuickStats);

module.exports = router;