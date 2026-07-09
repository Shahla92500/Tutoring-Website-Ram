const TutoringRequest = require("../models/TutoringRequest");
const User = require("../models/User");
const mongoose = require("mongoose");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function createTutoringRequest(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    // only learners can create requests
    if (req.user.role !== "learner") {
      return res.status(403).json({ message: "Only learners can create requests" });
    }

    const { tutorId, title, topic, description, preferredDate, preferredTime, duration, sessionType } = req.body;

    if (!tutorId || !title || !topic) {
      return res.status(400).json({ message: "tutorId, title, and topic are required" });
    }

    if (!isValidObjectId(tutorId)) {
      return res.status(400).json({ message: "Invalid tutorId" });
    }

    // Verify tutor exists and is alumni
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== "alumni") {
      return res.status(404).json({ message: "Tutor not found or invalid" });
    }

    const newRequest = await TutoringRequest.create({
      learnerId: req.user._id,
      tutorId,
      title,
      topic,
      description,
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      preferredTime,
      duration: duration || 30,
      sessionType: sessionType || "video",
      status: "OPEN",
    });

    // Populate learner info for immediate response
    await newRequest.populate("learnerId", "username firstname lastname email");
    await newRequest.populate("tutorId", "username firstname lastname email");

    res.status(201).json({ 
      message: "Request created successfully", 
      request: newRequest 
    });
  } catch (err) {
    console.error("Create request error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}

async function getRequests(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    let requests;

    // If learner: only their requests
    if (req.user.role === "learner") {
      requests = await TutoringRequest.find({ learnerId: req.user._id })
        .populate("tutorId", "username firstname lastname email skills")
        .sort({ createdAt: -1 });
      return res.json(requests);
    }

    // If alumni: requests assigned to them (all statuses)
    if (req.user.role === "alumni") {
      requests = await TutoringRequest.find({ tutorId: req.user._id })
        .populate("learnerId", "username firstname lastname email cohort track")
        .sort({ createdAt: -1 });
      return res.json(requests);
    }

    // If admin: see all requests
    if (req.user.role === "admin") {
      requests = await TutoringRequest.find()
        .populate("learnerId", "username firstname lastname email")
        .populate("tutorId", "username firstname lastname email")
        .sort({ createdAt: -1 });
      return res.json(requests);
    }

    return res.status(403).json({ message: "Forbidden" });
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}

async function acceptRequest(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    // only alumni can accept
    if (req.user.role !== "alumni") {
      return res.status(403).json({ message: "Only alumni can accept requests" });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const request = await TutoringRequest.findById(req.params.id)
      .populate("learnerId", "username firstname lastname email")
      .populate("tutorId", "username firstname lastname email");

    if (!request) return res.status(404).json({ message: "Request not found" });

    // Verify this request is for this tutor
    if (request.tutorId._id.toString() !== req.user._id) {
      return res.status(403).json({ message: "You can only accept your own requests" });
    }

    if (request.status !== "OPEN") {
      return res.status(400).json({ message: `Request is not open (status: ${request.status})` });
    }

    request.status = "ACCEPTED";
    await request.save();

    res.json({ message: "Request accepted", request });
  } catch (err) {
    console.error("Accept request error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}

async function declineRequest(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    // only alumni can decline
    if (req.user.role !== "alumni") {
      return res.status(403).json({ message: "Only alumni can decline requests" });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const request = await TutoringRequest.findById(req.params.id)
      .populate("learnerId", "username firstname lastname email")
      .populate("tutorId", "username firstname lastname email");

    if (!request) return res.status(404).json({ message: "Request not found" });

    // Verify this request is for this tutor
    if (request.tutorId._id.toString() !== req.user._id) {
      return res.status(403).json({ message: "You can only decline your own requests" });
    }

    if (request.status !== "OPEN") {
      return res.status(400).json({ message: `Request is not open (status: ${request.status})` });
    }

    request.status = "DECLINED";
    await request.save();

    res.json({ message: "Request declined", request });
  } catch (err) {
    console.error("Decline request error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
}

module.exports = {
  createTutoringRequest,
  getRequests,
  acceptRequest,
  declineRequest,
};
