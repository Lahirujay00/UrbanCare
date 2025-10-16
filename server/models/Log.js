const mongoose = require("mongoose");

/**
 * Log Schema
 * Records all receptionist access and update activities
 */
const logSchema = new mongoose.Schema(
  {
    receptionistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receptionist",
      required: true,
    },
    receptionistName: {
      type: String,
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    patientCardId: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "Viewed patient record",
        "Updated patient contact",
        "Updated visit reason",
        "Patient search - not found",
        "Patient search - multiple matches",
        "Login successful",
        "Login failed",
      ],
    },
    details: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster log queries
logSchema.index({ timestamp: -1 });
logSchema.index({ receptionistId: 1 });
logSchema.index({ patientCardId: 1 });

module.exports = mongoose.model("Log", logSchema);
