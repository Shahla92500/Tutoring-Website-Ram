// controllers/learnerController.js
const TutoringRequest = require("../models/TutoringRequest");

// GET /learner/sessions - Get all sessions for the logged-in learner
const getSessions = async (req, res) => {
  try {
    const learnerId = req.user.id;

    const sessions = await TutoringRequest.find({
      learnerId: learnerId,
      status: { $in: ["ACCEPTED", "COMPLETED"] }
    })
      .populate("tutorId", "username firstname lastname email")
      .sort({ preferredDate: 1 });

    // Transform to match frontend expected format
    const formattedSessions = sessions.map((session) => ({
      id: session._id.toString(),
      date: session.preferredDate || session.createdAt,
      time: session.preferredTime || "TBD",
      topic: session.topic,
      mentorName: session.tutorId
        ? `${session.tutorId.firstname || ""} ${session.tutorId.lastname || ""}`.trim() || session.tutorId.username
        : "Unknown",
      status: session.status === "ACCEPTED" ? "accepted" : "completed",
      duration: `${session.duration} min`
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error("Error fetching learner sessions:", error);
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
};

// GET /learner/quick-stats - Get quick stats for the logged-in learner
const getQuickStats = async (req, res) => {
  try {
    const learnerId = req.user.id;

    // Count completed sessions
    const completedSessions = await TutoringRequest.countDocuments({
      learnerId: learnerId,
      status: "COMPLETED"
    });

    // Calculate total hours learned (sum of durations from completed sessions)
    const completedSessionsData = await TutoringRequest.find({
      learnerId: learnerId,
      status: "COMPLETED"
    });

    const totalMinutes = completedSessionsData.reduce(
      (sum, session) => sum + (session.duration || 0),
      0
    );
    const hoursLearned = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal

    // For now, streak is placeholder - you can implement real streak logic later
    const currentStreak = completedSessions > 0 ? Math.min(completedSessions, 7) : 0;

    res.json({
      sessionsAttended: completedSessions,
      hoursLearned: hoursLearned,
      currentStreak: currentStreak
    });
  } catch (error) {
    console.error("Error fetching learner stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

module.exports = {
  getSessions,
  getQuickStats
};