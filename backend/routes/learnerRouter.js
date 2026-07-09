// routes/learnerRouter.js
const express = require("express");
const router = express.Router();
const { getSessions, getQuickStats } = require("../controllers/learnerController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware);

// GET /learner/sessions - Get learner's sessions
router.get("/sessions", getSessions);

// GET /learner/quick-stats - Get learner's quick stats
router.get("/quick-stats", getQuickStats);

module.exports = router;