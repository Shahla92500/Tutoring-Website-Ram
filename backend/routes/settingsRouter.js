const express = require("express");
const SiteSettings = require("../models/SiteSettings");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const router = express.Router();

const selectableOptionKeys = [
  "contactMethods",
  "serviceTypes",
  "urgencyWindows",
  "urgencyFlags",
  "assessmentSubjects",
  "courseCategories",
];

const defaultSelectableOptions = {
  contactMethods: ["Email", "Phone", "WhatsApp"],
  serviceTypes: ["High School", "University", "Exam Prep"],
  urgencyWindows: ["Within 2 weeks", "Within 1 month", "Within 3 months"],
  urgencyFlags: ["No", "Yes"],
  assessmentSubjects: ["Math", "Physics", "Both"],
  courseCategories: ["University Courses", "High School Courses", "Exam Prep"],
};

function normalizeOptions(options) {
  const normalized = {};
  for (const key of selectableOptionKeys) {
    const values = Array.isArray(options?.[key]) ? options[key] : defaultSelectableOptions[key];
    normalized[key] = [...new Set(values.map((value) => String(value).trim().replace(/\s+/g, " ")).filter(Boolean))];
  }
  return normalized;
}

async function getSettingsDocument() {
  const settings = await SiteSettings.findOneAndUpdate(
    { key: "global" },
    {
      $setOnInsert: {
        key: "global",
        selectableOptions: defaultSelectableOptions,
      },
    },
    { new: true, upsert: true }
  );

  const normalizedOptions = normalizeOptions(settings.selectableOptions);
  if (JSON.stringify(settings.selectableOptions) !== JSON.stringify(normalizedOptions)) {
    settings.selectableOptions = normalizedOptions;
    await settings.save();
  }

  return settings;
}

router.get("/", async (req, res) => {
  try {
    const settings = await getSettingsDocument();
    res.json({ selectableOptions: settings.selectableOptions });
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ message: "Failed to load settings" });
  }
});

router.put("/selectable-options", authMiddleware, adminOnly, async (req, res) => {
  try {
    const normalizedOptions = normalizeOptions(req.body?.selectableOptions);
    const settings = await SiteSettings.findOneAndUpdate(
      { key: "global" },
      { selectableOptions: normalizedOptions },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      message: "Selectable options updated",
      selectableOptions: settings.selectableOptions,
    });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

module.exports = router;
