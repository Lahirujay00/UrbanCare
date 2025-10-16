const mongoose = require("mongoose");

/**
 * Patient Schema
 * Stores patient medical and personal information
 */
const patientSchema = new mongoose.Schema(
  {
    cardId: {
      type: String,
      required: [true, "Digital health card ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [0, "Age cannot be negative"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female", "Other"],
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    allergies: {
      type: [String],
      default: [],
    },
    prescriptions: [
      {
        medication: {
          type: String,
          required: true,
        },
        dosage: {
          type: String,
          required: true,
        },
        frequency: {
          type: String,
          required: true,
        },
        prescribedBy: String,
        prescribedDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    appointments: [
      {
        date: {
          type: Date,
          required: true,
        },
        time: String,
        doctor: String,
        department: String,
        reason: String,
        status: {
          type: String,
          enum: ["scheduled", "completed", "cancelled"],
          default: "scheduled",
        },
      },
    ],
    visitReason: {
      type: String,
      trim: true,
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster card ID searches
patientSchema.index({ cardId: 1 });

module.exports = mongoose.model("Patient", patientSchema);
