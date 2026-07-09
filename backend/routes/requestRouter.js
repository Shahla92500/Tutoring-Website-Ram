const express = require("express");
const requestRouter = express.Router();

const { authMiddleware } = require("../middleware/auth");
const {
  createTutoringRequest,
  getRequests,
  acceptRequest,
  declineRequest,
} = require("../controllers/requestController");

// GET /requests - Get requests (learner sees their own, alumni sees pending ones)
requestRouter.get("/", authMiddleware, getRequests);

// POST /requests - Create new request (learners only)
requestRouter.post("/", authMiddleware, createTutoringRequest);

// PATCH /requests/:id/accept - Accept a request (alumni only)
requestRouter.patch("/:id/accept", authMiddleware, acceptRequest);

// PATCH /requests/:id/decline - Decline a request (alumni only)
requestRouter.patch("/:id/decline", authMiddleware, declineRequest);

module.exports = requestRouter;