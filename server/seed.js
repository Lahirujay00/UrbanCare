/**
 * MongoDB Seeding Script for Smart Healthcare System - Receptionist Module
 *
 * Purpose: Populate database with sample data for testing
 * Run with: node seed.js
 *
 * This script will:
 * 1. Connect to MongoDB
 * 2. Clear existing data
 * 3. Create sample receptionists, patients, and logs
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Receptionist = require("./models/Receptionist");
const Patient = require("./models/Patient");
const Log = require("./models/Log");

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

/**
 * Sample Receptionists Data
 */
const receptionistsData = [
  {
    name: "Kavindu Perera",
    email: "kavindu@hospital.lk",
    password: "123456",
    employeeId: "REC001",
  },
  {
    name: "Sithmi Fernando",
    email: "sithmi@hospital.lk",
    password: "654321",
    employeeId: "REC002",
  },
];

/**
 * Sample Patients Data
 */
const patientsData = [
  {
    cardId: "HC2025001",
    name: "Nimal Perera",
    age: 45,
    gender: "Male",
    contactNumber: "+94 77 123 4567",
    bloodType: "O+",
    allergies: ["Penicillin", "Pollen"],
    prescriptions: [
      {
        medication: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        prescribedBy: "Dr. Silva",
        prescribedDate: new Date("2025-01-10"),
      },
      {
        medication: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        prescribedBy: "Dr. Silva",
        prescribedDate: new Date("2025-01-10"),
      },
    ],
    appointments: [
      {
        date: new Date("2025-02-15"),
        time: "10:00 AM",
        doctor: "Dr. Silva",
        department: "General Medicine",
        reason: "Diabetes follow-up",
        status: "scheduled",
      },
    ],
    visitReason: "Diabetes management and blood pressure monitoring",
    emergencyContact: {
      name: "Kamala Perera",
      relationship: "Wife",
      phone: "+94 77 123 4568",
    },
  },
  {
    cardId: "HC2025002",
    name: "Sanduni Wijesinghe",
    age: 32,
    gender: "Female",
    contactNumber: "+94 71 234 5678",
    bloodType: "A+",
    allergies: ["Latex"],
    prescriptions: [
      {
        medication: "Levothyroxine",
        dosage: "75mcg",
        frequency: "Once daily morning",
        prescribedBy: "Dr. Mendis",
        prescribedDate: new Date("2024-12-20"),
      },
    ],
    appointments: [
      {
        date: new Date("2025-01-25"),
        time: "2:30 PM",
        doctor: "Dr. Mendis",
        department: "Endocrinology",
        reason: "Thyroid check-up",
        status: "scheduled",
      },
    ],
    visitReason: "Routine thyroid function monitoring",
    emergencyContact: {
      name: "Anil Wijesinghe",
      relationship: "Father",
      phone: "+94 77 234 5679",
    },
  },
  {
    cardId: "HC2025003",
    name: "Rajith Fernando",
    age: 58,
    gender: "Male",
    contactNumber: "+94 76 345 6789",
    bloodType: "B+",
    allergies: ["Aspirin", "Sulfa drugs"],
    prescriptions: [
      {
        medication: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once daily evening",
        prescribedBy: "Dr. Jayawardena",
        prescribedDate: new Date("2025-01-05"),
      },
      {
        medication: "Aspirin",
        dosage: "81mg",
        frequency: "Once daily",
        prescribedBy: "Dr. Jayawardena",
        prescribedDate: new Date("2025-01-05"),
      },
    ],
    appointments: [
      {
        date: new Date("2025-01-20"),
        time: "9:00 AM",
        doctor: "Dr. Jayawardena",
        department: "Cardiology",
        reason: "Post-surgery follow-up",
        status: "scheduled",
      },
    ],
    visitReason: "Cardiac health monitoring post bypass surgery",
    emergencyContact: {
      name: "Malini Fernando",
      relationship: "Wife",
      phone: "+94 76 345 6790",
    },
  },
  {
    cardId: "HC2025004",
    name: "Dilini Amarasinghe",
    age: 28,
    gender: "Female",
    contactNumber: "+94 70 456 7890",
    bloodType: "AB+",
    allergies: [],
    prescriptions: [],
    appointments: [
      {
        date: new Date("2025-02-01"),
        time: "11:00 AM",
        doctor: "Dr. Perera",
        department: "Obstetrics",
        reason: "Prenatal checkup",
        status: "scheduled",
      },
    ],
    visitReason: "Regular prenatal care - 20 weeks pregnant",
    emergencyContact: {
      name: "Kasun Amarasinghe",
      relationship: "Husband",
      phone: "+94 70 456 7891",
    },
  },
  {
    cardId: "HC2025005",
    name: "Chandana Gunasekara",
    age: 67,
    gender: "Male",
    contactNumber: "+94 75 567 8901",
    bloodType: "O-",
    allergies: ["Codeine", "Morphine"],
    prescriptions: [
      {
        medication: "Metformin",
        dosage: "1000mg",
        frequency: "Twice daily",
        prescribedBy: "Dr. Rodrigo",
        prescribedDate: new Date("2024-12-15"),
      },
      {
        medication: "Amlodipine",
        dosage: "5mg",
        frequency: "Once daily",
        prescribedBy: "Dr. Rodrigo",
        prescribedDate: new Date("2024-12-15"),
      },
      {
        medication: "Gabapentin",
        dosage: "300mg",
        frequency: "Three times daily",
        prescribedBy: "Dr. Rodrigo",
        prescribedDate: new Date("2024-12-15"),
      },
    ],
    appointments: [
      {
        date: new Date("2025-01-28"),
        time: "3:00 PM",
        doctor: "Dr. Rodrigo",
        department: "General Medicine",
        reason: "Diabetes and neuropathy management",
        status: "scheduled",
      },
    ],
    visitReason: "Diabetic neuropathy treatment and glucose control",
    emergencyContact: {
      name: "Priyanka Gunasekara",
      relationship: "Daughter",
      phone: "+94 75 567 8902",
    },
  },
];

/**
 * Seed Database
 */
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...\n");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Receptionist.deleteMany({});
    await Patient.deleteMany({});
    await Log.deleteMany({});
    console.log("✅ Existing data cleared\n");

    // Create receptionists
    console.log("👥 Creating receptionists...");
    const createdReceptionists = [];

    for (const recData of receptionistsData) {
      const receptionist = await Receptionist.create(recData);
      createdReceptionists.push(receptionist);
      console.log(`   ✓ ${receptionist.name} (${receptionist.email})`);
    }
    console.log(`✅ ${createdReceptionists.length} receptionists created\n`);

    // Create patients
    console.log("🏥 Creating patients...");
    const createdPatients = [];

    for (const patientData of patientsData) {
      const patient = await Patient.create(patientData);
      createdPatients.push(patient);
      console.log(`   ✓ ${patient.name} (Card ID: ${patient.cardId})`);
    }
    console.log(`✅ ${createdPatients.length} patients created\n`);

    // Create sample logs
    console.log("📋 Creating activity logs...");
    const logsData = [
      {
        receptionistId: createdReceptionists[0]._id,
        receptionistName: createdReceptionists[0].name,
        patientId: createdPatients[0]._id,
        patientCardId: createdPatients[0].cardId,
        action: "Viewed patient record",
        details: `Accessed record for ${createdPatients[0].name}`,
        timestamp: new Date("2025-01-15T09:30:00"),
      },
      {
        receptionistId: createdReceptionists[1]._id,
        receptionistName: createdReceptionists[1].name,
        patientId: createdPatients[1]._id,
        patientCardId: createdPatients[1].cardId,
        action: "Updated patient contact",
        details: "Updated contact number",
        timestamp: new Date("2025-01-15T10:15:00"),
      },
      {
        receptionistId: createdReceptionists[0]._id,
        receptionistName: createdReceptionists[0].name,
        patientId: createdPatients[2]._id,
        patientCardId: createdPatients[2].cardId,
        action: "Viewed patient record",
        details: `Accessed record for ${createdPatients[2].name}`,
        timestamp: new Date("2025-01-15T11:00:00"),
      },
      {
        receptionistId: createdReceptionists[1]._id,
        receptionistName: createdReceptionists[1].name,
        patientId: createdPatients[3]._id,
        patientCardId: createdPatients[3].cardId,
        action: "Updated visit reason",
        details: "Updated visit reason for appointment",
        timestamp: new Date("2025-01-15T14:30:00"),
      },
      {
        receptionistId: createdReceptionists[0]._id,
        receptionistName: createdReceptionists[0].name,
        patientId: createdPatients[4]._id,
        patientCardId: createdPatients[4].cardId,
        action: "Viewed patient record",
        details: `Accessed record for ${createdPatients[4].name}`,
        timestamp: new Date("2025-01-15T15:45:00"),
      },
    ];

    const createdLogs = await Log.insertMany(logsData);
    console.log(`✅ ${createdLogs.length} activity logs created\n`);

    // Summary
    console.log("═══════════════════════════════════════════");
    console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("═══════════════════════════════════════════");
    console.log("\n📊 Summary:");
    console.log(`   • Receptionists: ${createdReceptionists.length}`);
    console.log(`   • Patients: ${createdPatients.length}`);
    console.log(`   • Activity Logs: ${createdLogs.length}`);

    console.log("\n🔐 Receptionist Login Credentials:");
    console.log("   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    receptionistsData.forEach((rec, index) => {
      console.log(`   ${index + 1}. Email: ${rec.email}`);
      console.log(`      Password: ${rec.password}`);
      console.log(`      Employee ID: ${rec.employeeId}`);
      console.log("   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });

    console.log("\n🏥 Sample Patient Health Card IDs:");
    console.log("   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    createdPatients.forEach((patient, index) => {
      console.log(`   ${index + 1}. ${patient.cardId} - ${patient.name}`);
    });
    console.log("   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log("\n✨ You can now test the receptionist module!\n");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

/**
 * Run the seeder
 */
const runSeeder = async () => {
  await connectDB();
  await seedDatabase();
  await mongoose.connection.close();
  console.log("🔌 Database connection closed");
  process.exit(0);
};

// Execute seeder
runSeeder();
