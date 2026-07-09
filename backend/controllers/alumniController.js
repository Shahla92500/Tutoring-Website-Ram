// controllers/alumniController.js
const TutoringRequest = require("../models/TutoringRequest");

// GET /alumni/sessions - Get all sessions for the logged-in alumni/tutor
const getSessions = async (req, res) => {
  try {
    const tutorId = req.user.id;

    const sessions = await TutoringRequest.find({
      tutorId: tutorId,
      status: { $in: ["OPEN", "ACCEPTED", "COMPLETED"] }
    })
      .populate("learnerId", "username firstname lastname email cohort")
      .sort({ createdAt: -1 });

    // Transform to match frontend expected format
    const formattedSessions = sessions.map((session) => {
      let status = "pending";
      if (session.status === "OPEN") status = "new_request";
      else if (session.status === "ACCEPTED") status = "accepted";
      else if (session.status === "COMPLETED") status = "completed";

      return {
        id: session._id.toString(),
        date: session.preferredDate || session.createdAt,
        time: session.preferredTime || "TBD",
        topic: session.topic,
        learnerName: session.learnerId
          ? `${session.learnerId.firstname || ""} ${session.learnerId.lastname || ""}`.trim() || session.learnerId.username
          : "Unknown",
        status: status,
        duration: `${session.duration} min`
      };
    });

    res.json(formattedSessions);
  } catch (error) {
    console.error("Error fetching alumni sessions:", error);
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
};

// GET /alumni/quick-stats - Get quick stats for the logged-in alumni/tutor
const getQuickStats = async (req, res) => {
  try {
    const tutorId = req.user.id;

    // Count completed sessions
    const completedSessions = await TutoringRequest.countDocuments({
      tutorId: tutorId,
      status: "COMPLETED"
    });

    // Count unique learners helped
    const uniqueLearners = await TutoringRequest.distinct("learnerId", {
      tutorId: tutorId,
      status: { $in: ["ACCEPTED", "COMPLETED"] }
    });

    // For now, badges is placeholder - you can implement real badge logic later
    const badgesEarned = completedSessions >= 10 ? 3 : completedSessions >= 5 ? 2 : completedSessions >= 1 ? 1 : 0;

    res.json({
      learnersHelped: uniqueLearners.length,
      sessionsCompleted: completedSessions,
      badgesEarned: badgesEarned
    });
  } catch (error) {
    console.error("Error fetching alumni stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

module.exports = {
  getSessions,
  getQuickStats
};