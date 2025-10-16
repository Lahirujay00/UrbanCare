const Log = require("../models/Log");

/**
 * @desc    Get recent access logs
 * @route   GET /api/logs
 * @access  Private (Receptionist)
 */
const getLogs = async (req, res) => {
  try {
    const { limit = 50, page = 1, receptionistId, action } = req.query;

    // Build query filter
    const filter = {};

    if (receptionistId) {
      filter.receptionistId = receptionistId;
    }

    if (action) {
      filter.action = action;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch logs with pagination
    const logs = await Log.find(filter)
      .populate("receptionistId", "name email employeeId")
      .populate("patientId", "name cardId")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const total = await Log.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: logs,
    });
  } catch (error) {
    console.error("Get logs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving logs",
    });
  }
};

/**
 * @desc    Get logs for a specific patient
 * @route   GET /api/logs/patient/:cardId
 * @access  Private (Receptionist)
 */
const getLogsByPatient = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { limit = 20 } = req.query;

    const logs = await Log.find({ patientCardId: cardId.toUpperCase() })
      .populate("receptionistId", "name email")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: logs.length,
      patientCardId: cardId.toUpperCase(),
      data: logs,
    });
  } catch (error) {
    console.error("Get patient logs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving patient logs",
    });
  }
};

/**
 * @desc    Get logs for current receptionist
 * @route   GET /api/logs/me
 * @access  Private (Receptionist)
 */
const getMyLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const logs = await Log.find({ receptionistId: req.receptionist._id })
      .populate("patientId", "name cardId")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("Get my logs error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving your logs",
    });
  }
};

module.exports = {
  getLogs,
  getLogsByPatient,
  getMyLogs,
};
