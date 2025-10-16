const mongoose = require('mongoose');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
require('dotenv').config();

async function createTestPatientData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the doctor (assuming the logged-in doctor)
    const doctor = await User.findOne({ role: 'doctor' });
    if (!doctor) {
      console.log('No doctor found in database');
      return;
    }
    console.log(`Found doctor: ${doctor.firstName} ${doctor.lastName} (${doctor._id})`);

    // Create test patients
    const testPatients = [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@test.com',
        password: 'password123',
        role: 'patient',
        dateOfBirth: new Date('1995-03-15'),
        gender: 'female',
        phone: '+1-555-0101',
        bloodType: 'O+',
        digitalHealthCardId: 'HC-SJ-001',
        allergies: [
          { allergen: 'Penicillin', severity: 'severe' },
          { allergen: 'Shellfish', severity: 'moderate' }
        ],
        chronicConditions: ['Hypertension', 'Anxiety'],
        isActive: true
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@test.com',
        password: 'password123',
        role: 'patient',
        dateOfBirth: new Date('1978-11-22'),
        gender: 'male',
        phone: '+1-555-0102',
        bloodType: 'A+',
        digitalHealthCardId: 'HC-MC-002',
        allergies: [],
        chronicConditions: ['Diabetes Type 2', 'High Cholesterol'],
        isActive: true
      },
      {
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily.rodriguez@test.com',
        password: 'password123',
        role: 'patient',
        dateOfBirth: new Date('1992-07-08'),
        gender: 'female',
        phone: '+1-555-0103',
        bloodType: 'B-',
        digitalHealthCardId: 'HC-ER-003',
        allergies: [
          { allergen: 'Latex', severity: 'severe' }
        ],
        chronicConditions: ['Migraine', 'GERD'],
        isActive: true
      }
    ];

    // Create patients
    const createdPatients = [];
    for (const patientData of testPatients) {
      // Check if patient already exists
      const existingPatient = await User.findOne({ email: patientData.email });
      if (existingPatient) {
        console.log(`Patient ${patientData.firstName} ${patientData.lastName} already exists`);
        createdPatients.push(existingPatient);
        continue;
      }

      const patient = new User(patientData);
      await patient.save();
      createdPatients.push(patient);
      console.log(`Created patient: ${patient.firstName} ${patient.lastName} (${patient._id})`);
    }

    // Create appointments for each patient with the doctor
    for (const patient of createdPatients) {
      // Check if appointment already exists
      const existingAppointment = await Appointment.findOne({ 
        patient: patient._id, 
        doctor: doctor._id 
      });
      
      if (existingAppointment) {
        console.log(`Appointment already exists for ${patient.firstName} ${patient.lastName}`);
        continue;
      }

      const appointment = new Appointment({
        patient: patient._id,
        doctor: doctor._id,
        appointmentDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in next 7 days
        appointmentTime: '10:00',
        appointmentType: 'consultation',
        status: 'confirmed',
        chiefComplaint: 'Regular checkup',
        createdBy: doctor._id
      });
      
      await appointment.save();
      console.log(`Created appointment for ${patient.firstName} ${patient.lastName}`);
    }

    // Create medical records for each patient
    for (const patient of createdPatients) {
      // Check if medical record already exists
      const existingRecord = await MedicalRecord.findOne({ 
        patient: patient._id, 
        doctor: doctor._id 
      });
      
      if (existingRecord) {
        console.log(`Medical record already exists for ${patient.firstName} ${patient.lastName}`);
        continue;
      }

      const medicalRecord = new MedicalRecord({
        patient: patient._id,
        doctor: doctor._id,
        recordType: 'consultation',
        chiefComplaint: 'Regular checkup',
        diagnosis: 'Routine examination - patient stable',
        treatment: 'Continue current medications, lifestyle modifications',
        notes: 'Patient reports feeling well. Vital signs normal.',
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 98.6,
          weight: 150,
          height: 68
        },
        status: 'active',
        createdBy: doctor._id
      });
      
      await medicalRecord.save();
      console.log(`Created medical record for ${patient.firstName} ${patient.lastName}`);
    }

    console.log('\n✅ Test data created successfully!');
    console.log(`Created ${createdPatients.length} patients with appointments and medical records`);
    
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createTestPatientData();
