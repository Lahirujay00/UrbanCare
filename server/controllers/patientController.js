const Patient = require("../models/Patient");
const Log = require("../models/Log");

/**
 * @desc    Get patient by digital health card ID
 * @route   GET /api/patients/:cardId
 * @access  Private (Receptionist)
 */
const getPatientByCardId = async (req, res) => {
  try {
    const { cardId } = req.params;

    // Validate card ID
    if (!cardId || cardId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid health card ID",
      });
    }

    // Search for patient by card ID (case-insensitive)
    const patients = await Patient.find({
      cardId: new RegExp(`^${cardId.trim()}$`, "i"),
      isActive: true,
    });

    // Handle no matches
    if (patients.length === 0) {
      // Log the failed search
      await Log.create({
        receptionistId: req.receptionist._id,
        receptionistName: req.receptionist.name,
        patientCardId: cardId.toUpperCase(),
        action: "Patient search - not found",
        details: `Card ID: ${cardId.toUpperCase()}`,
        ipAddress: req.ip,
      });

      return res.status(404).json({
        success: false,
        message: "No patient found with this health card ID",
        cardId: cardId.toUpperCase(),
      });
    }

    // Handle multiple matches (should be rare due to unique constraint)
    if (patients.length > 1) {
      // Log the multiple match scenario
      await Log.create({
        receptionistId: req.receptionist._id,
        receptionistName: req.receptionist.name,
        patientCardId: cardId.toUpperCase(),
        action: "Patient search - multiple matches",
        details: `Found ${
          patients.length
        } matches for Card ID: ${cardId.toUpperCase()}`,
        ipAddress: req.ip,
      });

      return res.status(409).json({
        success: false,
        message:
          "Multiple patients found with this card ID. Please contact system administrator.",
        count: patients.length,
      });
    }

    const patient = patients[0];

    // Log successful patient record access
    await Log.create({
      receptionistId: req.receptionist._id,
      receptionistName: req.receptionist.name,
      patientId: patient._id,
      patientCardId: patient.cardId,
      action: "Viewed patient record",
      details: `Accessed record for ${patient.name}`,
      ipAddress: req.ip,
    });

    // Return patient data
    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Get patient error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving patient record",
    });
  }
};

/**
 * @desc    Update patient non-sensitive details
 * @route   PUT /api/patients/update/:id
 * @access  Private (Receptionist)
 */
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { contactNumber, visitReason } = req.body;

    // Validate that at least one field is provided
    if (!contactNumber && !visitReason) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one field to update (contactNumber or visitReason)",
      });
    }

    // Find patient
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Store old values for logging
    const oldValues = {
      contactNumber: patient.contactNumber,
      visitReason: patient.visitReason,
    };

    // Update only allowed fields
    const updates = {};
    if (contactNumber !== undefined) {
      updates.contactNumber = contactNumber.trim();
    }
    if (visitReason !== undefined) {
      updates.visitReason = visitReason.trim();
    }

    // Update patient
    const updatedPatient = await Patient.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    // Create detailed log entry
    let logDetails = "Updated: ";
    const changes = [];

    if (
      contactNumber !== undefined &&
      oldValues.contactNumber !== contactNumber
    ) {
      changes.push(`Contact: ${oldValues.contactNumber} → ${contactNumber}`);
    }
    if (visitReason !== undefined && oldValues.visitReason !== visitReason) {
      changes.push(
        `Visit Reason: "${oldValues.visitReason || "N/A"}" → "${visitReason}"`
      );
    }

    logDetails += changes.join(", ");

    // Log the update
    await Log.create({
      receptionistId: req.receptionist._id,
      receptionistName: req.receptionist.name,
      patientId: patient._id,
      patientCardId: patient.cardId,
      action: contactNumber
        ? "Updated patient contact"
        : "Updated visit reason",
      details: logDetails,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: "Patient information updated successfully",
      data: updatedPatient,
    });
  } catch (error) {
    console.error("Update patient error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating patient information",
    });
  }
};

/**
 * @desc    Get all active patients (for admin/testing)
 * @route   GET /api/patients
 * @access  Private (Receptionist)
 */
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ isActive: true })
      .select("-__v")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error("Get all patients error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving patients",
    });
  }
};

module.exports = {
  getPatientByCardId,
  updatePatient,
  getAllPatients,
};
