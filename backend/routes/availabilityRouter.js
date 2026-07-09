const express = require("express");
const router = express.Router();
const User = require("../models/User");

/**
 * GET availability events for a user (for FullCalendar)
 * Returns: [{ title, date, startTime?, endTime?, userId, username, firstname, lastname }]
 *
 * Usage:
 *   GET /availability/user/:id
 *   GET /availability/user/:id?from=2025-12-01&to=2025-12-31
 *
 * Notes:
 * - FullCalendar "dayGrid" accepts events with { title, date }.
 * - We also include startTime/endTime so you can later switch to timeGrid views.
 */
router.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to } = req.query;

    const user = await User.findById(id).select("username firstname lastname availability");
    if (!user) return res.status(404).json({ error: "User not found" });

    let items = user.availability || [];

    // Optional date range filter (from/to)
    if (from || to) {
      const fromDate = from ? new Date(from) : new Date("1970-01-01");
      const toDate = to ? new Date(to) : new Date("2999-12-31");
      items = items.filter((a) => {
        const d = new Date(a.date);
        return d >= fromDate && d <= toDate;
      });
    }

    const events = items.map((a) => {
      // FullCalendar dayGrid expects `date` as YYYY-MM-DD OR ISO string
      const dateOnly = new Date(a.date).toISOString().slice(0, 10);

      const displayName =
        (user.firstname || user.lastname)
          ? `${user.firstname || ""} ${user.lastname || ""}`.trim()
          : user.username;

      return {
        title: `Available: ${displayName}`,
        date: dateOnly,
        startTime: a.startTime,
        endTime: a.endTime,
        userId: String(user._id),
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
      };
    });

    res.json(events);
  } catch (err) {
    res.status(400).json({ error: err.message || "Invalid request" });
  }
});

/**
 * GET availability events for all alumni tutors (optional)
 * Returns all tutor availability for calendar browsing.
 *
 * Usage:
 *   GET /availability/tutors
 *   GET /availability/tutors?from=2025-12-01&to=2025-12-31
 */
router.get("/tutors", async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date("1970-01-01");
    const toDate = to ? new Date(to) : new Date("2999-12-31");

    const tutors = await User.find({ role: "alumni" }).select("username firstname lastname availability");

    const events = [];
    for (const t of tutors) {
      const displayName =
        (t.firstname || t.lastname)
          ? `${t.firstname || ""} ${t.lastname || ""}`.trim()
          : t.username;

      for (const a of (t.availability || [])) {
        const d = new Date(a.date);
        if (d < fromDate || d > toDate) continue;

        events.push({
          title: `Tutor Available: ${displayName}`,
          date: d.toISOString().slice(0, 10),
          startTime: a.startTime,
          endTime: a.endTime,
          userId: String(t._id),
          username: t.username,
          firstname: t.firstname,
          lastname: t.lastname,
        });
      }
    }

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

/**
 * POST add availability for a user
 * Body: { date: "2025-12-25", startTime?: "09:00", endTime?: "17:00" }
 *
 * Usage:
 *   POST /availability/user/:id
 */
router.post("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime } = req.body;

    if (!date) return res.status(400).json({ error: "date is required" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.availability.push({
      date: new Date(date),
      startTime,
      endTime,
    });

    await user.save();

    res.status(201).json({ message: "Availability added", availability: user.availability });
  } catch (err) {
    res.status(400).json({ error: err.message || "Bad request" });
  }
});

/**
 * DELETE one availability entry by its subdocument _id
 *
 * Usage:
 *   DELETE /availability/user/:userId/:availabilityId
 */
router.delete("/user/:userId/:availabilityId", async (req, res) => {
  try {
    const { userId, availabilityId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const before = user.availability.length;
    user.availability = user.availability.filter((a) => String(a._id) !== String(availabilityId));

    if (user.availability.length === before) {
      return res.status(404).json({ error: "Availability entry not found" });
    }

    await user.save();
    res.json({ message: "Availability removed", availability: user.availability });
  } catch (err) {
    res.status(400).json({ error: err.message || "Invalid request" });
  }
});

module.exports = router;
