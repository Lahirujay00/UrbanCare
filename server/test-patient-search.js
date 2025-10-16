require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('./models/Patient');
const Receptionist = require('./models/Receptionist');
const jwt = require('jsonwebtoken');

const testPatientSearch = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check patients
    const patients = await Patient.find({});
    console.log(`\n📋 Total patients in database: ${patients.length}`);
    
    if (patients.length > 0) {
      console.log('\n👥 Patients:');
      patients.forEach((p, index) => {
        console.log(`  ${index + 1}. ${p.cardId} - ${p.name} - Active: ${p.isActive}`);
      });
    } else {
      console.log('❌ No patients found! Run seed.js first.');
    }

    // Check receptionists
    const receptionists = await Receptionist.find({});
    console.log(`\n👔 Total receptionists: ${receptionists.length}`);
    
    if (receptionists.length > 0) {
      console.log('\n👥 Receptionists:');
      receptionists.forEach((r, index) => {
        console.log(`  ${index + 1}. ${r.email} - ${r.name} - Active: ${r.isActive}`);
        
        // Generate a test token
        const token = jwt.sign({ id: r._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log(`     Token: ${token.substring(0, 50)}...`);
      });
    } else {
      console.log('❌ No receptionists found! Run seed.js first.');
    }

    await mongoose.connection.close();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testPatientSearch();
