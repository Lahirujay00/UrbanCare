require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const Receptionist = require("./models/Receptionist");
const jwt = require("jsonwebtoken");

const testAPI = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get a receptionist
    const receptionist = await Receptionist.findOne({
      email: "kavindu@hospital.lk",
    });

    if (!receptionist) {
      console.log("❌ Receptionist not found!");
      process.exit(1);
    }

    // Generate token
    const token = jwt.sign({ id: receptionist._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log("✅ Token generated for:", receptionist.email);

    // Test patient search
    const cardId = "HC2025001";
    console.log(`\n🔍 Searching for patient with card ID: ${cardId}`);

    try {
      const response = await axios.get(
        `http://localhost:5000/api/receptionist/patients/${cardId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ API Response Status:", response.status);
      console.log("📋 Patient Data:", JSON.stringify(response.data, null, 2));
    } catch (apiError) {
      console.error("❌ API Error:", apiError.response?.status);
      console.error("❌ Error Message:", apiError.response?.data);
      console.error("❌ Full Error:", apiError.message);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

testAPI();
