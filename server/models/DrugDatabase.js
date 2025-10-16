const mongoose = require('mongoose');

/**
 * Drug Database Model - Comprehensive drug information and safety data
 * Contains drug details, interactions, allergies, and dosage information
 */
const drugDatabaseSchema = new mongoose.Schema({
  // Basic Drug Information
  drugName: {
    type: String,
    required: [true, 'Drug name is required'],
    trim: true,
    index: true
  },
  genericName: {
    type: String,
    required: [true, 'Generic name is required'],
    trim: true,
    index: true
  },
  brandNames: [{
    type: String,
    trim: true
  }],
  
  // Drug Classification
  drugClass: {
    type: String,
    required: [true, 'Drug class is required']
  },
  therapeuticCategory: {
    type: String,
    required: [true, 'Therapeutic category is required']
  },
  
  // Drug Codes and Identifiers
  ndcNumber: String, // National Drug Code
  rxcui: String, // RxNorm Concept Unique Identifier
  atcCode: String, // Anatomical Therapeutic Chemical Code
  
  // Available Forms and Strengths
  availableForms: [{
    form: {
      type: String,
      enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'patch'],
      required: true
    },
    strengths: [String],
    routeOfAdministration: {
      type: String,
      enum: ['oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical', 'inhalation', 'rectal']
    }
  }],
  
  // Dosage Information
  dosageGuidelines: {
    adult: {
      standardDose: String,
      maxDose: String,
      frequency: String
    },
    pediatric: {
      weightBasedDose: String, // mg/kg
      maxDose: String,
      frequency: String
    },
    elderly: {
      adjustedDose: String,
      precautions: String
    },
    renalAdjustment: {
      mildImpairment: String,
      moderateImpairment: String,
      severeImpairment: String
    },
    hepaticAdjustment: {
      mildImpairment: String,
      moderateImpairment: String,
      severeImpairment: String
    }
  },
  
  // Safety Information
  contraindications: [String],
  warnings: [String],
  precautions: [String],
  
  // Common Allergic Reactions
  commonAllergicReactions: [{
    reaction: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'life-threatening']
    },
    frequency: String // rare, uncommon, common
  }],
  
  // Drug Interactions
  interactions: [{
    interactingDrug: String,
    interactionType: {
      type: String,
      enum: ['major', 'moderate', 'minor']
    },
    mechanism: String,
    clinicalEffect: String,
    management: String
  }],
  
  // Food and Lifestyle Interactions
  foodInteractions: [{
    food: String,
    effect: String,
    recommendation: String
  }],
  
  // Side Effects
  sideEffects: {
    common: [String], // >10%
    uncommon: [String], // 1-10%
    rare: [String] // <1%
  },
  
  // Monitoring Requirements
  monitoring: {
    labTests: [String],
    frequency: String,
    parameters: [String]
  },
  
  // Pregnancy and Lactation
  pregnancyCategory: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'X']
  },
  lactationSafety: {
    type: String,
    enum: ['safe', 'caution', 'avoid']
  },
  
  // Controlled Substance Information
  controlledSubstance: {
    isControlled: { type: Boolean, default: false },
    schedule: {
      type: String,
      enum: ['I', 'II', 'III', 'IV', 'V']
    },
    deaRequired: { type: Boolean, default: false }
  },
  
  // Storage and Stability
  storage: {
    temperature: String,
    lightSensitive: { type: Boolean, default: false },
    moistureSensitive: { type: Boolean, default: false },
    specialInstructions: String
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['active', 'discontinued', 'recalled'],
    default: 'active'
  },
  fdaApproved: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient searching
drugDatabaseSchema.index({ drugName: 'text', genericName: 'text', brandNames: 'text' });
drugDatabaseSchema.index({ drugClass: 1 });
drugDatabaseSchema.index({ therapeuticCategory: 1 });
drugDatabaseSchema.index({ status: 1 });
drugDatabaseSchema.index({ 'controlledSubstance.isControlled': 1 });

// Static method to search drugs
drugDatabaseSchema.statics.searchDrugs = function(searchTerm, limit = 20) {
  return this.find({
    $or: [
      { drugName: { $regex: searchTerm, $options: 'i' } },
      { genericName: { $regex: searchTerm, $options: 'i' } },
      { brandNames: { $regex: searchTerm, $options: 'i' } }
    ],
    status: 'active'
  })
  .select('drugName genericName brandNames drugClass availableForms')
  .limit(limit);
};

// Static method to check drug interactions
drugDatabaseSchema.statics.checkDrugInteractions = async function(drugList) {
  const interactions = [];
  
  for (let i = 0; i < drugList.length; i++) {
    const drug1 = await this.findOne({
      $or: [
        { drugName: { $regex: drugList[i], $options: 'i' } },
        { genericName: { $regex: drugList[i], $options: 'i' } }
      ]
    });
    
    if (drug1) {
      for (let j = i + 1; j < drugList.length; j++) {
        const interaction = drug1.interactions.find(int => 
          int.interactingDrug.toLowerCase().includes(drugList[j].toLowerCase())
        );
        
        if (interaction) {
          interactions.push({
            drug1: drugList[i],
            drug2: drugList[j],
            severity: interaction.interactionType,
            mechanism: interaction.mechanism,
            clinicalEffect: interaction.clinicalEffect,
            management: interaction.management
          });
        }
      }
    }
  }
  
  return interactions;
};

// Static method to get dosage recommendations
drugDatabaseSchema.statics.getDosageRecommendation = function(drugName, patientAge, patientWeight, renalFunction, hepaticFunction) {
  return this.findOne({
    $or: [
      { drugName: { $regex: drugName, $options: 'i' } },
      { genericName: { $regex: drugName, $options: 'i' } }
    ]
  }).then(drug => {
    if (!drug) return null;
    
    let recommendation = {};
    
    // Age-based dosing
    if (patientAge < 18) {
      recommendation = drug.dosageGuidelines.pediatric;
    } else if (patientAge >= 65) {
      recommendation = drug.dosageGuidelines.elderly;
    } else {
      recommendation = drug.dosageGuidelines.adult;
    }
    
    // Renal adjustment
    if (renalFunction && renalFunction < 60) {
      if (renalFunction < 30) {
        recommendation.adjustment = drug.dosageGuidelines.renalAdjustment.severeImpairment;
      } else if (renalFunction < 60) {
        recommendation.adjustment = drug.dosageGuidelines.renalAdjustment.moderateImpairment;
      }
    }
    
    // Hepatic adjustment
    if (hepaticFunction && hepaticFunction === 'impaired') {
      recommendation.hepaticAdjustment = drug.dosageGuidelines.hepaticAdjustment.mildImpairment;
    }
    
    return {
      drug: drug.drugName,
      recommendation,
      warnings: drug.warnings,
      contraindications: drug.contraindications,
      monitoring: drug.monitoring
    };
  });
};

module.exports = mongoose.model('DrugDatabase', drugDatabaseSchema);
