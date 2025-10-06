const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');

const router = express.Router();

// Healthcare knowledge base for chatbot responses
const healthcareKnowledge = {
  symptoms: {
    fever: {
      description: 'Body temperature above normal (98.6°F/37°C)',
      commonCauses: ['Infection', 'Inflammation', 'Heat exhaustion', 'Medication reaction'],
      whenToSeekHelp: 'If fever is above 103°F (39.4°C) or persists for more than 3 days',
      homeRemedies: ['Rest', 'Stay hydrated', 'Cool compress', 'Light clothing']
    },
    headache: {
      description: 'Pain in the head or neck area',
      commonCauses: ['Tension', 'Dehydration', 'Stress', 'Eye strain', 'Sinus issues'],
      whenToSeekHelp: 'If sudden, severe, or accompanied by fever, stiff neck, or vision changes',
      homeRemedies: ['Rest in dark room', 'Stay hydrated', 'Cold/warm compress', 'Gentle massage']
    },
    cough: {
      description: 'Reflex action to clear airways',
      commonCauses: ['Cold', 'Allergies', 'Asthma', 'Acid reflux', 'Smoking'],
      whenToSeekHelp: 'If persistent for more than 3 weeks, blood in cough, or difficulty breathing',
      homeRemedies: ['Stay hydrated', 'Honey (for adults)', 'Humidifier', 'Avoid irritants']
    }
  },
  emergencySymptoms: [
    'chest pain',
    'difficulty breathing',
    'severe bleeding',
    'loss of consciousness',
    'severe head injury',
    'stroke symptoms',
    'heart attack symptoms',
    'severe allergic reaction',
    'poisoning',
    'severe burns'
  ],
  healthTips: {
    nutrition: [
      'Eat 5-9 servings of fruits and vegetables daily',
      'Choose whole grains over refined grains',
      'Limit processed foods and added sugars',
      'Stay hydrated with 8 glasses of water daily',
      'Include lean proteins in your diet'
    ],
    exercise: [
      'Aim for 150 minutes of moderate exercise weekly',
      'Include strength training 2-3 times per week',
      'Take breaks from sitting every hour',
      'Start slowly and gradually increase intensity',
      'Find activities you enjoy to stay motivated'
    ],
    sleep: [
      'Aim for 7-9 hours of sleep nightly',
      'Maintain a consistent sleep schedule',
      'Create a relaxing bedtime routine',
      'Keep bedroom cool, dark, and quiet',
      'Avoid screens 1 hour before bedtime'
    ],
    mentalHealth: [
      'Practice stress management techniques',
      'Stay connected with friends and family',
      'Engage in activities you enjoy',
      'Seek professional help when needed',
      'Practice mindfulness or meditation'
    ]
  }
};

// @desc    Process chatbot message
// @route   POST /api/chatbot/message
// @access  Private
router.post('/message', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.id;

    // Get user information for personalized responses
    const user = await User.findById(userId).select('-password');
    
    // Process the message and generate response
    const response = await processUserMessage(message, user, context);

    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date(),
        userId
      }
    });
  } catch (error) {
    console.error('Chatbot message processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your message',
      error: error.message
    });
  }
});

// @desc    Get user's chat history
// @route   GET /api/chatbot/history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // In a real implementation, you'd store chat history in database
    // For now, return empty history
    res.json({
      success: true,
      data: {
        messages: [],
        totalCount: 0
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving chat history',
      error: error.message
    });
  }
});

// @desc    Get healthcare tips
// @route   GET /api/chatbot/health-tips/:category
// @access  Private
router.get('/health-tips/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const tips = healthcareKnowledge.healthTips[category];

    if (!tips) {
      return res.status(404).json({
        success: false,
        message: 'Health tips category not found'
      });
    }

    res.json({
      success: true,
      data: {
        category,
        tips,
        totalTips: tips.length
      }
    });
  } catch (error) {
    console.error('Get health tips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving health tips',
      error: error.message
    });
  }
});

// @desc    Get symptom information
// @route   GET /api/chatbot/symptom/:symptom
// @access  Private
router.get('/symptom/:symptom', auth, async (req, res) => {
  try {
    const { symptom } = req.params;
    const symptomInfo = healthcareKnowledge.symptoms[symptom.toLowerCase()];

    if (!symptomInfo) {
      return res.json({
        success: true,
        data: {
          symptom,
          found: false,
          message: 'I don\'t have specific information about this symptom. Please consult with a healthcare professional for proper evaluation.',
          recommendation: 'Book an appointment with a doctor for proper diagnosis and treatment.'
        }
      });
    }

    res.json({
      success: true,
      data: {
        symptom,
        found: true,
        ...symptomInfo,
        disclaimer: 'This information is for educational purposes only and should not replace professional medical advice.'
      }
    });
  } catch (error) {
    console.error('Get symptom info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving symptom information',
      error: error.message
    });
  }
});

// @desc    Check for emergency keywords
// @route   POST /api/chatbot/emergency-check
// @access  Private
router.post('/emergency-check', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMessage = message.toLowerCase();
    
    const isEmergency = healthcareKnowledge.emergencySymptoms.some(symptom => 
      lowerMessage.includes(symptom)
    );

    res.json({
      success: true,
      data: {
        isEmergency,
        message: isEmergency ? 
          'Emergency keywords detected. If this is a medical emergency, please call 911 immediately.' :
          'No emergency keywords detected.',
        emergencyContacts: isEmergency ? {
          emergency: '911',
          hospital: '(555) 123-4567',
          urgentCare: '(555) 123-4568'
        } : null
      }
    });
  } catch (error) {
    console.error('Emergency check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking for emergency',
      error: error.message
    });
  }
});

// Helper function to process user messages
async function processUserMessage(message, user, context = {}) {
  const lowerMessage = message.toLowerCase();
  
  // Check for emergency
  const isEmergency = healthcareKnowledge.emergencySymptoms.some(symptom => 
    lowerMessage.includes(symptom)
  );

  if (isEmergency) {
    return {
      type: 'emergency',
      priority: 'critical',
      message: '🚨 EMERGENCY DETECTED 🚨\n\nIf this is a medical emergency:\n• Call 911 immediately\n• Go to the nearest emergency room\n• Contact emergency services\n\nEmergency Contacts:\n• Emergency: 911\n• Hospital: (555) 123-4567',
      actions: [
        { label: 'Call 911', action: 'call', number: '911' },
        { label: 'Find Emergency Room', action: 'navigate', path: '/emergency' }
      ],
      suggestions: []
    };
  }

  // Appointment-related queries
  if (lowerMessage.includes('appointment') || lowerMessage.includes('book') || lowerMessage.includes('schedule')) {
    try {
      const upcomingAppointments = await Appointment.find({ 
        patient: user._id, 
        appointmentDate: { $gte: new Date() } 
      }).limit(3);

      return {
        type: 'appointment',
        message: `📅 I can help you with appointments!\n\nYou have ${upcomingAppointments.length} upcoming appointments.\n\nWhat would you like to do?`,
        suggestions: ['Book new appointment', 'View my appointments', 'Cancel appointment', 'Find doctors'],
        actions: [
          { label: 'Book Appointment', action: 'navigate', path: '/appointments/book' },
          { label: 'View Schedule', action: 'navigate', path: '/dashboard' }
        ],
        data: {
          upcomingCount: upcomingAppointments.length,
          nextAppointment: upcomingAppointments[0] || null
        }
      };
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  }

  // Medical records queries
  if (lowerMessage.includes('record') || lowerMessage.includes('history') || lowerMessage.includes('report')) {
    try {
      const recordsCount = await MedicalRecord.countDocuments({ patient: user._id });
      
      return {
        type: 'records',
        message: `📋 You have ${recordsCount} medical records in your account.\n\nI can help you:\n• View your medical history\n• Download reports\n• Upload new documents\n• Share records with doctors`,
        suggestions: ['View records', 'Download reports', 'Upload document', 'Share with doctor'],
        actions: [
          { label: 'View Records', action: 'navigate', path: '/records' },
          { label: 'Upload Document', action: 'tab', tab: 'documents' }
        ],
        data: {
          recordsCount
        }
      };
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  }

  // Symptom queries
  const symptomKeywords = ['symptom', 'pain', 'fever', 'headache', 'cough', 'sick', 'hurt'];
  if (symptomKeywords.some(keyword => lowerMessage.includes(keyword))) {
    // Check if specific symptom mentioned
    let symptomInfo = null;
    for (const [symptom, info] of Object.entries(healthcareKnowledge.symptoms)) {
      if (lowerMessage.includes(symptom)) {
        symptomInfo = { symptom, ...info };
        break;
      }
    }

    if (symptomInfo) {
      return {
        type: 'symptom',
        message: `🩺 Information about ${symptomInfo.symptom}:\n\n${symptomInfo.description}\n\nCommon causes: ${symptomInfo.commonCauses.join(', ')}\n\nWhen to seek help: ${symptomInfo.whenToSeekHelp}`,
        suggestions: ['Book doctor appointment', 'More symptoms info', 'Home remedies', 'Emergency help'],
        disclaimer: 'This information is for educational purposes only. Please consult a healthcare professional for proper diagnosis.',
        data: symptomInfo
      };
    }

    return {
      type: 'symptom',
      message: '🩺 I understand you\'re experiencing symptoms.\n\n**Important:** I can provide general information, but cannot diagnose medical conditions.\n\nFor proper medical evaluation:\n• Book an appointment with a doctor\n• Visit urgent care if symptoms are severe\n• Call 911 for emergencies',
      suggestions: ['Book appointment', 'Find urgent care', 'Symptom checker', 'Health tips'],
      disclaimer: 'This is not medical advice. Please consult a healthcare professional.'
    };
  }

  // Health tips
  if (lowerMessage.includes('health') || lowerMessage.includes('tips') || lowerMessage.includes('wellness')) {
    const tipCategories = Object.keys(healthcareKnowledge.healthTips);
    const randomCategory = tipCategories[Math.floor(Math.random() * tipCategories.length)];
    const tips = healthcareKnowledge.healthTips[randomCategory];
    
    return {
      type: 'health_tips',
      message: `🌟 Here are some ${randomCategory} tips:\n\n${tips.slice(0, 3).map(tip => `• ${tip}`).join('\n')}`,
      suggestions: ['Nutrition tips', 'Exercise tips', 'Sleep tips', 'Mental health tips'],
      data: {
        category: randomCategory,
        allTips: tips
      }
    };
  }

  // Payment queries
  if (lowerMessage.includes('payment') || lowerMessage.includes('bill') || lowerMessage.includes('refund')) {
    return {
      type: 'payment',
      message: '💳 I can help with payment and billing!\n\n• View payment history\n• Process refunds\n• Insurance information\n• Payment methods\n• Billing inquiries',
      suggestions: ['Payment history', 'Request refund', 'Insurance help', 'Billing support'],
      actions: [
        { label: 'View Payments', action: 'navigate', path: '/payments' },
        { label: 'Request Refund', action: 'tab', tab: 'refunds' }
      ]
    };
  }

  // Default response
  return {
    type: 'general',
    message: `Hello ${user.firstName}! I'm here to help with your healthcare needs.\n\nI can assist you with:\n• Booking appointments\n• Medical records and documents\n• Payment and billing questions\n• Health information and tips\n• Emergency assistance\n\nWhat would you like help with today?`,
    suggestions: ['Book appointment', 'View records', 'Health tips', 'Payment help', 'Emergency info'],
    personalizedGreeting: true
  };
}

module.exports = router;
