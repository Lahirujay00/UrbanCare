const mongoose = require('mongoose');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
require('dotenv').config();

async function checkMedicalRecordData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find the treatment plan record
    const records = await MedicalRecord.find({ 
      recordType: 'treatment-plan',
      title: { $regex: /Acute Respiratory Infection/i }
    })
      .populate('doctor', 'firstName lastName')
      .populate('patient', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(1);

    if (records.length === 0) {
      console.log('❌ No matching records found');
    } else {
      console.log('\n📋 Found Record:');
      console.log('ID:', records[0]._id);
      console.log('Title:', records[0].title);
      console.log('Record Type:', records[0].recordType);
      console.log('Doctor:', records[0].doctor?.firstName, records[0].doctor?.lastName);
      console.log('Patient:', records[0].patient?.firstName, records[0].patient?.lastName);
      console.log('\n📝 Treatment Plan Field:');
      console.log('Has treatmentPlan:', !!records[0].treatmentPlan);
      console.log('Treatment Plan Length:', records[0].treatmentPlan?.length || 0);
      console.log('Treatment Plan Content:');
      console.log(records[0].treatmentPlan || 'NONE');
      
      console.log('\n🧪 Lab Tests Field:');
      console.log('Has labTests:', !!records[0].labTests);
      console.log('Lab Tests:', records[0].labTests);
      
      console.log('\n💊 Prescriptions Field:');
      console.log('Has prescriptions:', !!records[0].prescriptions);
      console.log('Prescriptions:', JSON.stringify(records[0].prescriptions, null, 2));
      
      console.log('\n📄 Documents Field:');
      console.log('Has documents:', !!records[0].documents);
      console.log('Documents Count:', records[0].documents?.length || 0);
      if (records[0].documents?.length > 0) {
        console.log('Documents:', JSON.stringify(records[0].documents, null, 2));
      }
      
      console.log('\n📊 All Fields:');
      console.log(JSON.stringify(records[0].toObject(), null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMedicalRecordData();
