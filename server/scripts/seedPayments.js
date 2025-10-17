require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/urbancare';

async function seedPayments() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Find patients, doctors, and appointments
    const patients = await User.find({ role: 'patient' }).limit(3);
    const doctors = await User.find({ role: 'doctor' }).limit(3);
    
    if (patients.length === 0 || doctors.length === 0) {
      console.log('❌ No patients or doctors found. Please run seed scripts first.');
      process.exit(1);
    }

    console.log(`Found ${patients.length} patients and ${doctors.length} doctors`);

    // Check if appointments exist
    let appointments = await Appointment.find().limit(5);
    
    // If no appointments, create some
    if (appointments.length === 0) {
      console.log('Creating sample appointments...');
      const appointmentsToCreate = [];
      
      for (let i = 0; i < 5; i++) {
        const patient = patients[i % patients.length];
        const doctor = doctors[i % doctors.length];
        
        appointmentsToCreate.push({
          patient: patient._id,
          doctor: doctor._id,
          appointmentDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Last 5 days
          timeSlot: '10:00 AM - 10:30 AM',
          status: 'completed',
          consultationFee: [1500, 1800, 3000][i % 3],
          chiefComplaint: 'Regular checkup',
          paymentStatus: 'completed'
        });
      }
      
      appointments = await Appointment.insertMany(appointmentsToCreate);
      console.log(`✅ Created ${appointments.length} appointments`);
    }

    // Remove existing sample payments
    await Payment.deleteMany({ transactionId: /^SEED_/ });

    // Create sample payments
    const paymentsToCreate = [];
    const paymentMethods = ['card', 'cash', 'online'];
    
    for (let i = 0; i < appointments.length; i++) {
      const appointment = appointments[i];
      const patient = patients[i % patients.length];
      const doctor = doctors[i % doctors.length];
      const amount = appointment.consultationFee || [1500, 1800, 3000][i % 3];
      
      paymentsToCreate.push({
        transactionId: `SEED_TXN_${Date.now()}_${i}`,
        appointment: appointment._id,
        patient: patient._id,
        doctor: doctor._id,
        amount: amount,
        currency: 'LKR',
        breakdown: {
          consultationFee: amount,
          labTestsFee: 0,
          medicationFee: 0,
          facilityFee: 0,
          tax: 0,
          discount: 0
        },
        paymentMethod: paymentMethods[i % paymentMethods.length],
        paymentGateway: 'manual',
        status: 'completed',
        paymentDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        metadata: {
          source: 'seed_script',
          notes: 'Sample payment data'
        }
      });
    }

    const createdPayments = await Payment.insertMany(paymentsToCreate);
    console.log(`✅ Created ${createdPayments.length} payments`);

    // Calculate total revenue
    const totalRevenue = createdPayments.reduce((sum, payment) => sum + payment.amount, 0);
    console.log(`💰 Total Revenue: LKR ${totalRevenue.toLocaleString()}`);

    console.log('\n📋 Payment Details:');
    createdPayments.forEach((payment, index) => {
      console.log(`  ${index + 1}. LKR ${payment.amount.toLocaleString()} - ${payment.paymentMethod} - ${payment.paymentDate.toLocaleDateString()}`);
    });

    console.log('\n✅ Payment seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seedPayments();
