import React, { useState } from "react";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

const Appointments = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [prescription, setPrescription] = useState({
    medications: [],
    instructions: "",
  });

  // Mock appointments data
  const appointments = [
    {
      id: 1,
      patient: "Sarah Johnson",
      age: 28,
      time: "9:00 AM",
      date: "2025-01-05",
      type: "Consultation",
      status: "confirmed",
      reason: "Chest pain and shortness of breath",
      phone: "+1 (555) 123-4567",
      email: "sarah.johnson@email.com",
      bloodType: "O+",
      allergies: ["Penicillin"],
      notes:
        "Patient reports intermittent chest discomfort over the past week.",
      insurance: "Blue Cross Blue Shield",
      emergencyContact: "John Johnson - +1 (555) 123-4568",
      medicalHistory: ["Anxiety disorder", "Previous bronchitis"],
      currentMedications: ["Lisinopril 10mg daily", "Atorvastatin 20mg"],
      vitals: { bp: "140/90", hr: "85 bpm", temp: "98.6°F", weight: "145 lbs" },
      labResults: ["CBC - Normal", "Lipid panel - Elevated cholesterol"],
      lastVisitSummary: "Patient doing well on current medication regimen.",
    },
    {
      id: 2,
      patient: "Michael Chen",
      age: 45,
      time: "10:30 AM",
      date: "2025-01-05",
      type: "Follow-up",
      status: "in-progress",
      reason: "Diabetes management review",
      phone: "+1 (555) 987-6543",
      email: "michael.chen@email.com",
      bloodType: "A+",
      allergies: ["None"],
      notes: "Regular diabetes check-up. Patient has been following diet plan.",
    },
    {
      id: 3,
      patient: "Emily Rodriguez",
      age: 32,
      time: "2:00 PM",
      date: "2025-01-05",
      type: "Consultation",
      status: "pending",
      reason: "Annual health checkup",
      phone: "+1 (555) 456-7890",
      email: "emily.rodriguez@email.com",
      bloodType: "B-",
      allergies: ["Shellfish", "Latex"],
      notes: "First visit for annual physical examination.",
    },
    {
      id: 4,
      patient: "David Wilson",
      age: 52,
      time: "3:30 PM",
      date: "2025-01-05",
      type: "Emergency",
      status: "urgent",
      reason: "Acute abdominal pain",
      phone: "+1 (555) 321-0987",
      email: "david.wilson@email.com",
      bloodType: "AB+",
      allergies: ["Aspirin"],
      notes: "Patient reports severe abdominal pain starting this morning.",
    },
    {
      id: 5,
      patient: "Lisa Thompson",
      age: 39,
      time: "11:00 AM",
      date: "2025-01-06",
      type: "Follow-up",
      status: "confirmed",
      reason: "Post-surgery check",
      phone: "+1 (555) 654-3210",
      email: "lisa.thompson@email.com",
      bloodType: "O-",
      allergies: ["Latex"],
      notes: "Post-operative follow-up after appendectomy.",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesDate = appointment.date === selectedDate;
    const matchesStatus =
      filterStatus === "all" || appointment.status === filterStatus;
    const matchesSearch =
      appointment.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesStatus && matchesSearch;
  });

  const handleStatusChange = (appointmentId, newStatus) => {
    // In real app, this would make an API call
    console.log(`Changing appointment ${appointmentId} status to ${newStatus}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Appointment Management
          </h1>
          <p className="text-gray-600">
            Manage your patient appointments and schedule
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="urgent">Urgent</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Patients
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          {filteredAppointments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredAppointments.map((appointment, index) => (
                <div
                  key={appointment.id}
                  className={`p-6 ${index === 0 ? "rounded-t-2xl" : ""} ${
                    index === filteredAppointments.length - 1
                      ? "rounded-b-2xl"
                      : ""
                  } hover:bg-gray-50 transition-colors duration-200`}
                >
                  <div className="flex items-start justify-between">
                    {/* Patient Info */}
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <UserIcon className="w-8 h-8 text-white" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {appointment.patient}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {appointment.status.charAt(0).toUpperCase() +
                              appointment.status.slice(1).replace("-", " ")}
                          </span>
                          {appointment.status === "urgent" && (
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <ClockIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {appointment.time} • {appointment.type}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <UserIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Age: {appointment.age} • Blood:{" "}
                                {appointment.bloodType}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <PhoneIcon className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {appointment.phone}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                              <span className="text-sm text-gray-600">
                                Allergies:{" "}
                                {appointment.allergies.join(", ") || "None"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-gray-50 to-green-50 p-4 rounded-xl mb-4">
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Reason:</strong> {appointment.reason}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-6">
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowDetailModal(true);
                          setAppointmentNotes(appointment.notes || "");
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium shadow-md flex items-center space-x-2"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>View Details</span>
                      </button>{" "}
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-md flex items-center space-x-2">
                        <PencilIcon className="w-4 h-4" />
                        <span>Update</span>
                      </button>
                      {appointment.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusChange(appointment.id, "confirmed")
                            }
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-md flex items-center space-x-2"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(appointment.id, "declined")
                            }
                            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-md flex items-center space-x-2"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                        </>
                      )}
                      {appointment.status === "confirmed" && (
                        <button
                          onClick={() =>
                            handleStatusChange(appointment.id, "in-progress")
                          }
                          className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-md flex items-center space-x-2"
                        >
                          <ClockIcon className="w-4 h-4" />
                          <span>Start</span>
                        </button>
                      )}
                      {appointment.status === "in-progress" && (
                        <button
                          onClick={() =>
                            handleStatusChange(appointment.id, "completed")
                          }
                          className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium shadow-md flex items-center space-x-2"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarIcon className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No appointments found
              </h3>
              <p className="text-gray-500 mb-6">
                No appointments match your current filters for the selected
                date.
              </p>
              <button
                onClick={() => {
                  setSelectedDate(new Date().toISOString().split("T")[0]);
                  setFilterStatus("all");
                  setSearchTerm("");
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Appointment Detail Modal */}
        {showDetailModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedAppointment.patient}
                    </h2>
                    <p className="text-gray-600">
                      {selectedAppointment.date} at {selectedAppointment.time}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Patient Information */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-blue-900 mb-3">
                        Patient Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Age:</span>{" "}
                          {selectedAppointment.age}
                        </p>
                        <p>
                          <span className="font-medium">Blood Type:</span>{" "}
                          {selectedAppointment.bloodType}
                        </p>
                        <p>
                          <span className="font-medium">Phone:</span>{" "}
                          {selectedAppointment.phone}
                        </p>
                        <p>
                          <span className="font-medium">Insurance:</span>{" "}
                          {selectedAppointment.insurance}
                        </p>
                        <p>
                          <span className="font-medium">
                            Emergency Contact:
                          </span>{" "}
                          {selectedAppointment.emergencyContact}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-red-900 mb-3">
                        Allergies & Warnings
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAppointment.allergies.map((allergy, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-red-200 text-red-800 text-sm font-medium rounded-full"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-green-900 mb-3">
                        Current Vitals
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center p-2 bg-white rounded-lg">
                          <div className="font-bold text-red-600">
                            {selectedAppointment.vitals?.bp}
                          </div>
                          <div className="text-xs text-gray-600">
                            Blood Pressure
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <div className="font-bold text-blue-600">
                            {selectedAppointment.vitals?.hr}
                          </div>
                          <div className="text-xs text-gray-600">
                            Heart Rate
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <div className="font-bold text-yellow-600">
                            {selectedAppointment.vitals?.temp}
                          </div>
                          <div className="text-xs text-gray-600">
                            Temperature
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg">
                          <div className="font-bold text-green-600">
                            {selectedAppointment.vitals?.weight}
                          </div>
                          <div className="text-xs text-gray-600">Weight</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-purple-900 mb-3">
                        Appointment Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">Type:</span>{" "}
                          {selectedAppointment.type}
                        </p>
                        <p>
                          <span className="font-medium">Reason:</span>{" "}
                          {selectedAppointment.reason}
                        </p>
                        <p>
                          <span className="font-medium">Status:</span>
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(
                              selectedAppointment.status
                            )}`}
                          >
                            {selectedAppointment.status
                              .replace("-", " ")
                              .toUpperCase()}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-orange-900 mb-3">
                        Current Medications
                      </h3>
                      <div className="space-y-1">
                        {selectedAppointment.currentMedications?.map(
                          (med, index) => (
                            <div
                              key={index}
                              className="text-sm bg-white p-2 rounded-lg"
                            >
                              {med}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-teal-900 mb-3">
                        Recent Lab Results
                      </h3>
                      <div className="space-y-1">
                        {selectedAppointment.labResults?.map(
                          (result, index) => (
                            <div
                              key={index}
                              className="text-sm bg-white p-2 rounded-lg"
                            >
                              {result}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Appointment Notes
                      </h3>
                      <textarea
                        value={appointmentNotes}
                        onChange={(e) => setAppointmentNotes(e.target.value)}
                        placeholder="Add notes for this appointment..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowPrescriptionModal(true);
                      setShowDetailModal(false);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add Prescription
                  </button>
                  <button
                    onClick={() => {
                      console.log(
                        "Saving appointment notes:",
                        appointmentNotes
                      );
                      setShowDetailModal(false);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prescription Modal */}
        {showPrescriptionModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    New Prescription - {selectedAppointment.patient}
                  </h2>
                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medications
                    </label>
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          placeholder="Medication name"
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Dosage"
                          className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Frequency"
                          className="w-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                          <PlusIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions
                    </label>
                    <textarea
                      value={prescription.instructions}
                      onChange={(e) =>
                        setPrescription({
                          ...prescription,
                          instructions: e.target.value,
                        })
                      }
                      placeholder="Enter special instructions for the patient..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">
                          Patient Allergies
                        </h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          {selectedAppointment.allergies.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowPrescriptionModal(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      console.log("Saving prescription:", prescription);
                      setShowPrescriptionModal(false);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
                  >
                    Save Prescription
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {filteredAppointments.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {
                  filteredAppointments.filter(
                    (apt) => apt.status === "confirmed"
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {
                  filteredAppointments.filter((apt) => apt.status === "pending")
                    .length
                }
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {
                  filteredAppointments.filter(
                    (apt) => apt.status === "in-progress"
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {
                  filteredAppointments.filter((apt) => apt.status === "urgent")
                    .length
                }
              </div>
              <div className="text-sm text-gray-600">Urgent</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
