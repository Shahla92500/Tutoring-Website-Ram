const mongoose = require("mongoose");

const { Schema } = mongoose;

const TutoringRequestSchema = new Schema(
  {
    learnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tutorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // What help is needed
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // Scheduling
    preferredDate: { type: Date },
    preferredTime: { type: String }, // e.g., "14:00"
    duration: { type: Number, default: 30 }, // minutes: 30, 45, 60
    sessionType: { 
      type: String, 
      enum: ["video", "chat"],
      default: "video" 
    },

    // Request lifecycle
    status: {
      type: String,
      enum: ["OPEN", "ACCEPTED", "DECLINED", "CANCELLED", "COMPLETED"],
      default: "OPEN",
      required: true,
    },

    // Meeting details (filled when accepted)
    meetingLink: { type: String },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
  },
  { timestamps: true }
);

// Indexes for performance
TutoringRequestSchema.index({ status: 1, tutorId: 1, createdAt: -1 });
TutoringRequestSchema.index({ learnerId: 1, createdAt: -1 });

module.exports = mongoose.model("TutoringRequest", TutoringRequestSchema);