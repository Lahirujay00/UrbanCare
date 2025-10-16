import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  ClockIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { toast } from "react-hot-toast";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [searchCardId, setSearchCardId] = useState("");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    phoneNumber: "",
    address: "",
    visitReason: "",
  });

  // Search patient by card ID
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCardId.trim()) {
      toast.error("Please enter a Health Card ID");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000/api"
        }/receptionist/patients/${searchCardId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setPatient(response.data.data);
        setEditData({
          phoneNumber: response.data.data.phoneNumber || "",
          address: response.data.data.address || "",
          visitReason: "",
        });
        toast.success("Patient found!");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(error.response?.data?.message || "Patient not found");
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  // Update patient information
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!patient) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000/api"
        }/receptionist/patients/update/${patient._id}`,
        editData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setPatient(response.data.data);
        setIsEditing(false);
        toast.success("Patient information updated successfully!");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <UserCircleIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Receptionist Dashboard
                </h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-emerald-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <MagnifyingGlassIcon className="h-6 w-6 mr-2 text-emerald-600" />
            Search Patient by Health Card ID
          </h2>

          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchCardId}
              onChange={(e) => setSearchCardId(e.target.value.toUpperCase())}
              placeholder="Enter Health Card ID (e.g., HC2025001)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {/* Patient Information Card */}
        {patient && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-emerald-100">
            {/* Patient Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-full">
                    <UserCircleIcon className="h-12 w-12 text-emerald-600" />
                  </div>
                  <div className="text-white">
                    <h3 className="text-2xl font-bold">{patient.name}</h3>
                    <p className="text-emerald-100">
                      Card ID: {patient.cardId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {patient.isActive ? (
                    <span className="flex items-center px-3 py-1 bg-green-500 text-white rounded-full text-sm">
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center px-3 py-1 bg-red-500 text-white rounded-full text-sm">
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Patient Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Basic Information
                  </h4>

                  <div className="flex items-start space-x-3">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <UserCircleIcon className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="text-gray-900 font-medium capitalize">
                        {patient.gender}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Blood Group</p>
                      <p className="text-gray-900 font-medium">
                        {patient.bloodGroup}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Contact Information
                  </h4>

                  <div className="flex items-start space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Phone Number</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.phoneNumber}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              phoneNumber: e.target.value,
                            })
                          }
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">
                          {patient.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Address</p>
                      {isEditing ? (
                        <textarea
                          value={editData.address}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              address: e.target.value,
                            })
                          }
                          rows="2"
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">
                          {patient.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit Reason */}
              {isEditing && (
                <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Visit
                  </label>
                  <textarea
                    value={editData.visitReason}
                    onChange={(e) =>
                      setEditData({ ...editData, visitReason: e.target.value })
                    }
                    rows="3"
                    placeholder="Enter the reason for today's visit..."
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Medical History */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">
                  Medical History
                </h4>
                {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patient.medicalHistory.map((condition, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {condition.condition}
                        </p>
                        <p className="text-xs text-gray-500">
                          Diagnosed:{" "}
                          {new Date(
                            condition.diagnosedDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No medical history recorded
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({
                          phoneNumber: patient.phoneNumber || "",
                          address: patient.address || "",
                          visitReason: "",
                        });
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={loading}
                      className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all"
                  >
                    Update Information
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!patient && !loading && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Search for a patient using their Health Card ID
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
