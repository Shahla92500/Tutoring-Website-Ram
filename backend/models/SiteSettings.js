const mongoose = require("mongoose");

const { Schema } = mongoose;

const optionSchema = {
  type: [String],
  default: [],
};

const SiteSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    selectableOptions: {
      contactMethods: optionSchema,
      serviceTypes: optionSchema,
      urgencyWindows: optionSchema,
      urgencyFlags: optionSchema,
      assessmentSubjects: optionSchema,
      courseCategories: optionSchema,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", SiteSettingsSchema);
