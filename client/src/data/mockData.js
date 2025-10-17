// Comprehensive Mock Data for UrbanCare Healthcare Management System
// This file contains all the mock data used throughout the application

// 1. Patient Visit Report Mock Data
export const mockPatientVisitData = [
  { hour: '08:00', totalVisits: 12, avgWaitMin: 15, staffOnDuty: 5 },
  { hour: '09:00', totalVisits: 18, avgWaitMin: 22, staffOnDuty: 5 },
  { hour: '10:00', totalVisits: 25, avgWaitMin: 38, staffOnDuty: 4 }, // Clear peak with understaffing
  { hour: '11:00', totalVisits: 22, avgWaitMin: 31, staffOnDuty: 6 },
  { hour: '12:00', totalVisits: 15, avgWaitMin: 20, staffOnDuty: 6 },
  { hour: '13:00', totalVisits: 14, avgWaitMin: 18, staffOnDuty: 5 },
  { hour: '14:00', totalVisits: 16, avgWaitMin: 21, staffOnDuty: 5 },
  { hour: '15:00', totalVisits: 20, avgWaitMin: 28, staffOnDuty: 5 },
  { hour: '16:00', totalVisits: 18, avgWaitMin: 24, staffOnDuty: 4 },
  { hour: '17:00', totalVisits: 12, avgWaitMin: 16, staffOnDuty: 4 }
];

export const mockPatientKPIs = {
  totalVisits: 172,
  averageWait: "24 min",
  peakHour: "10:00 AM",
  longestWait: "45 min"
};

// Extended patient visit data for weekly view
export const mockWeeklyPatientData = [
  { day: 'Monday', totalVisits: 180, avgWaitMin: 26, peakHour: '10:00 AM' },
  { day: 'Tuesday', totalVisits: 165, avgWaitMin: 22, peakHour: '11:00 AM' },
  { day: 'Wednesday', totalVisits: 195, avgWaitMin: 28, peakHour: '09:00 AM' },
  { day: 'Thursday', totalVisits: 158, avgWaitMin: 21, peakHour: '10:30 AM' },
  { day: 'Friday', totalVisits: 142, avgWaitMin: 19, peakHour: '09:30 AM' },
  { day: 'Saturday', totalVisits: 95, avgWaitMin: 15, peakHour: '11:00 AM' },
  { day: 'Sunday', totalVisits: 68, avgWaitMin: 12, peakHour: '14:00 PM' }
];

// 2. Staff Utilization Report Mock Data
export const mockStaffUtilizationData = [
  { hour: '08:00', patientLoad: 12, staffOnDuty: 5, ratio: 2.4, efficiency: 85 },
  { hour: '09:00', patientLoad: 18, staffOnDuty: 5, ratio: 3.6, efficiency: 92 },
  { hour: '10:00', patientLoad: 25, staffOnDuty: 4, ratio: 6.25, efficiency: 78 }, // Problem!
  { hour: '11:00', patientLoad: 22, staffOnDuty: 6, ratio: 3.67, efficiency: 88 },
  { hour: '12:00', patientLoad: 15, staffOnDuty: 6, ratio: 2.5, efficiency: 72 }, // Overstaffed
  { hour: '13:00', patientLoad: 14, staffOnDuty: 5, ratio: 2.8, efficiency: 82 },
  { hour: '14:00', patientLoad: 16, staffOnDuty: 5, ratio: 3.2, efficiency: 89 },
  { hour: '15:00', patientLoad: 20, staffOnDuty: 5, ratio: 4.0, efficiency: 95 },
  { hour: '16:00', patientLoad: 18, staffOnDuty: 4, ratio: 4.5, efficiency: 91 },
  { hour: '17:00', patientLoad: 12, staffOnDuty: 4, ratio: 3.0, efficiency: 86 }
];

export const mockStaffKPIs = {
  averageRatio: 3.4,
  totalOvertimeHours: 12,
  efficiencyScore: 86,
  understaffedHours: 2
};

// Staff details for utilization breakdown
export const mockStaffMembers = [
  { name: 'Dr. Sarah Johnson', role: 'Doctor', department: 'Emergency', hoursWorked: 42, utilization: 95, overtime: 2 },
  { name: 'Dr. Michael Chen', role: 'Doctor', department: 'Cardiology', hoursWorked: 40, utilization: 88, overtime: 0 },
  { name: 'Nurse Emma Wilson', role: 'Nurse', department: 'Emergency', hoursWorked: 38, utilization: 92, overtime: 0 },
  { name: 'Nurse David Brown', role: 'Nurse', department: 'Pediatrics', hoursWorked: 44, utilization: 96, overtime: 4 },
  { name: 'Tech Lisa Garcia', role: 'Technician', department: 'Radiology', hoursWorked: 36, utilization: 82, overtime: 0 },
  { name: 'Admin John Davis', role: 'Admin', department: 'Reception', hoursWorked: 40, utilization: 78, overtime: 0 }
];

// 3. Financial Summary Mock Data
export const mockFinancialKPIs = {
  totalRevenue: 520000,
  totalCosts: 480000,
  operatingMargin: 40000,
  profitMargin: 7.7,
  revenuePerPatient: 3023
};

export const mockCostBreakdown = [
  { name: 'Staff Salaries & Overtime', value: 300000, percentage: 62.5 },
  { name: 'Medical Supplies', value: 120000, percentage: 25 },
  { name: 'Administrative Costs', value: 40000, percentage: 8.3 },
  { name: 'Equipment & Maintenance', value: 20000, percentage: 4.2 }
];

export const mockRevenueBreakdown = [
  { name: 'Insurance Payments', value: 350000, percentage: 67.3 },
  { name: 'Direct Patient Payments', value: 120000, percentage: 23.1 },
  { name: 'Government Funding', value: 50000, percentage: 9.6 }
];

export const mockMonthlyFinancials = [
  { month: 'Jan', revenue: 480000, costs: 445000, margin: 35000 },
  { month: 'Feb', revenue: 510000, costs: 460000, margin: 50000 },
  { month: 'Mar', revenue: 520000, costs: 480000, margin: 40000 },
  { month: 'Apr', revenue: 495000, costs: 455000, margin: 40000 },
  { month: 'May', revenue: 535000, costs: 490000, margin: 45000 },
  { month: 'Jun', revenue: 520000, costs: 480000, margin: 40000 }
];

// 4. Peak Hours Prediction Mock Data (Enhanced ML Simulation)
export const mockPeakPrediction = {
  forecasts: [
    { 
      day: "Monday", 
      time: "09:00 AM - 11:00 AM", 
      level: "Very High", 
      confidence: 94,
      expectedPatients: 68,
      recommendedStaff: 12,
      note: "Post-weekend appointment backlog. Consider additional triage staff." 
    },
    { 
      day: "Wednesday", 
      time: "09:00 AM - 10:30 AM", 
      level: "High", 
      confidence: 89,
      expectedPatients: 52,
      recommendedStaff: 10,
      note: "Mid-week consultation peak. Cardiology appointments concentrated." 
    },
    { 
      day: "Friday", 
      time: "08:00 AM - 09:30 AM", 
      level: "Medium", 
      confidence: 82,
      expectedPatients: 35,
      recommendedStaff: 7,
      note: "End-of-week routine checkups. Lower complexity cases expected." 
    }
  ],
  insights: [
    "Monday mornings consistently show 40% higher patient volume",
    "Emergency cases peak during evening hours (6-8 PM)",
    "Pediatric appointments concentrate on Wednesday-Friday",
    "Weekend coverage could be reduced by 20% without impact"
  ]
};

// 5. Patient Database Mock Data (Secure Access Simulation)
export const mockPatientDB = {
  "12345": {
    mrn: "12345",
    name: "John A. Doe",
    dob: "1980-01-15",
    age: 45,
    gender: "Male",
    phone: "(555) 123-4567",
    email: "john.doe@email.com",
    address: "123 Main St, City, State 12345",
    emergencyContact: "Jane Doe - (555) 123-4568",
    insurance: "Blue Cross Blue Shield - Policy #BC123456789",
    visitHistory: [
      { 
        date: "2025-10-10", 
        reason: "Annual Physical Examination", 
        doctor: "Dr. Sarah Johnson",
        department: "General Medicine",
        diagnosis: "Routine checkup - Normal results",
        vitals: { bp: "120/80", temp: "98.6°F", pulse: "72 bpm" }
      },
      { 
        date: "2025-05-02", 
        reason: "Left Arm Fracture", 
        doctor: "Dr. Michael Chen",
        department: "Orthopedics",
        diagnosis: "Closed fracture of left radius - Treated with cast",
        vitals: { bp: "135/85", temp: "99.1°F", pulse: "88 bpm" }
      },
      {
        date: "2024-12-15",
        reason: "Flu Symptoms",
        doctor: "Dr. Sarah Johnson",
        department: "General Medicine",
        diagnosis: "Viral infection - Prescribed rest and fluids",
        vitals: { bp: "125/82", temp: "101.2°F", pulse: "95 bpm" }
      }
    ],
    allergies: ["Penicillin", "Shellfish"],
    medications: ["Lisinopril 10mg daily", "Multivitamin"],
    notes: "Patient is compliant with medications. Family history of hypertension.",
    lastVisit: "2025-10-10",
    nextAppointment: "2025-11-15 - Annual Follow-up"
  },
  "67890": {
    mrn: "67890",
    name: "Jane B. Smith",
    dob: "1992-05-20",
    age: 33,
    gender: "Female",
    phone: "(555) 234-5678",
    email: "jane.smith@email.com",
    address: "456 Oak Ave, City, State 12345",
    emergencyContact: "Robert Smith - (555) 234-5679",
    insurance: "Aetna - Policy #AE987654321",
    visitHistory: [
      {
        date: "2025-09-28",
        reason: "Prenatal Checkup",
        doctor: "Dr. Lisa Garcia",
        department: "Obstetrics",
        diagnosis: "Normal pregnancy progression - 24 weeks",
        vitals: { bp: "110/70", temp: "98.4°F", pulse: "78 bpm" }
      },
      {
        date: "2025-08-15",
        reason: "Routine Gynecological Exam",
        doctor: "Dr. Lisa Garcia",
        department: "Gynecology",
        diagnosis: "Normal examination results",
        vitals: { bp: "108/68", temp: "98.6°F", pulse: "72 bpm" }
      }
    ],
    allergies: ["None known"],
    medications: ["Prenatal Vitamins", "Iron Supplement"],
    notes: "First pregnancy. Patient is very health-conscious.",
    lastVisit: "2025-09-28",
    nextAppointment: "2025-10-28 - Prenatal Checkup"
  },
  "11111": {
    mrn: "11111",
    name: "Robert Johnson",
    dob: "1955-08-10",
    age: 70,
    gender: "Male",
    phone: "(555) 345-6789",
    email: "r.johnson@email.com",
    address: "789 Pine St, City, State 12345",
    emergencyContact: "Mary Johnson - (555) 345-6790",
    insurance: "Medicare - Policy #MC123456789",
    visitHistory: [
      {
        date: "2025-10-05",
        reason: "Diabetes Management",
        doctor: "Dr. Michael Chen",
        department: "Endocrinology",
        diagnosis: "Type 2 Diabetes - Well controlled",
        vitals: { bp: "140/90", temp: "98.5°F", pulse: "68 bpm" }
      }
    ],
    allergies: ["Aspirin"],
    medications: ["Metformin 500mg twice daily", "Atorvastatin 20mg daily"],
    notes: "Diabetic patient with good glucose control. Monitors blood sugar daily.",
    lastVisit: "2025-10-05",
    nextAppointment: "2025-11-05 - Diabetes Follow-up"
  }
};

// 6. Dashboard Summary Data
export const mockDashboardSummary = {
  todayStats: {
    totalPatients: 87,
    currentWaitTime: "22 min",
    staffOnDuty: 8,
    availableRooms: 12,
    emergencyCases: 3,
    scheduledAppointments: 124
  },
  alerts: [
    { type: "warning", message: "High patient volume expected at 10:00 AM", priority: "high" },
    { type: "info", message: "Dr. Chen running 15 minutes behind schedule", priority: "medium" },
    { type: "success", message: "All staff members checked in for today", priority: "low" }
  ],
  recentActivity: [
    { time: "09:15", action: "Patient checked in", details: "John Doe - Annual Physical" },
    { time: "09:10", action: "Staff arrived", details: "Dr. Sarah Johnson - Emergency Dept" },
    { time: "09:05", action: "Report generated", details: "Weekly Patient Volume Report" }
  ]
};

// 7. Report Templates
export const mockReportTemplates = {
  'patient-visit': {
    title: 'Patient Visit Report',
    description: 'Comprehensive analysis of patient flow and wait times',
    sections: ['Summary', 'Hourly Breakdown', 'Peak Analysis', 'Recommendations']
  },
  'staff-utilization': {
    title: 'Staff Utilization Report', 
    description: 'Staff efficiency and workload distribution analysis',
    sections: ['Utilization Overview', 'Department Breakdown', 'Overtime Analysis', 'Staffing Recommendations']
  },
  'financial-summary': {
    title: 'Financial Summary Report',
    description: 'Revenue, costs, and financial performance metrics',
    sections: ['Financial Overview', 'Revenue Analysis', 'Cost Breakdown', 'Profitability Trends']
  }
};

// Helper functions for mock data generation
export const generateHourlyData = (startHour = 8, endHour = 17) => {
  const hours = [];
  for (let i = startHour; i <= endHour; i++) {
    const hour = i.toString().padStart(2, '0') + ':00';
    const basePatients = Math.floor(Math.random() * 15) + 10;
    const peakMultiplier = (i >= 9 && i <= 11) ? 1.5 : 1;
    
    hours.push({
      hour,
      totalVisits: Math.floor(basePatients * peakMultiplier),
      avgWaitMin: Math.floor(Math.random() * 20) + 15,
      staffOnDuty: Math.floor(Math.random() * 3) + 4
    });
  }
  return hours;
};

export const generateDateRange = (days = 7) => {
  const dates = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      totalVisits: Math.floor(Math.random() * 50) + 100,
      avgWaitMin: Math.floor(Math.random() * 15) + 20
    });
  }
  return dates;
};

export default {
  mockPatientVisitData,
  mockPatientKPIs,
  mockWeeklyPatientData,
  mockStaffUtilizationData,
  mockStaffKPIs,
  mockStaffMembers,
  mockFinancialKPIs,
  mockCostBreakdown,
  mockRevenueBreakdown,
  mockMonthlyFinancials,
  mockPeakPrediction,
  mockPatientDB,
  mockDashboardSummary,
  mockReportTemplates,
  generateHourlyData,
  generateDateRange
};