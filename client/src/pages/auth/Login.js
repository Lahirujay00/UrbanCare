import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  EyeIcon,
  EyeSlashIcon,
  HeartIcon,
  UserCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isReceptionist, setIsReceptionist] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm() || loading) return;

    try {
      const result = await login(
        formData.email,
        formData.password,
        isReceptionist
      );
      if (result.success) {
        if (isReceptionist) {
          toast.success(
            "Welcome back, Receptionist! Ready to assist patients today."
          );
          navigate("/receptionist/dashboard");
        } else {
          const welcomeMessages = {
            patient: "Welcome back! Ready to manage your health?",
            doctor: "Welcome back, Doctor! Your patients await.",
            staff: "Welcome back! Ready to assist patients today.",
            manager: "Welcome back! Check today's analytics and reports.",
            admin: "Welcome back, Admin! System management awaits.",
          };

          const message =
            welcomeMessages[result.user?.role] || "Welcome back to UrbanCare!";
          toast.success(message);

          const roleRoutes = {
            patient: "/dashboard",
            doctor: "/doctor/dashboard",
            staff: "/staff/dashboard",
            manager: "/manager/dashboard",
            admin: "/admin/dashboard",
          };

          const redirectPath = roleRoutes[result.user?.role] || "/dashboard";
          navigate(redirectPath);
        }
      }
    } catch (error) {
      toast.error(error.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
            <HeartIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Welcome Back
          </h1>
          <p className="text-gray-600 mt-2">
            Sign in to your UrbanCare account
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
          {/* Receptionist Toggle */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    isReceptionist ? "bg-green-600" : "bg-gray-400"
                  } transition-colors`}
                >
                  <UserCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Login as Receptionist
                  </p>
                  <p className="text-xs text-gray-600">
                    Access patient records system
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isReceptionist}
                  onChange={(e) => setIsReceptionist(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`block w-14 h-8 rounded-full transition-colors ${
                    isReceptionist ? "bg-green-600" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                    isReceptionist ? "translate-x-6" : ""
                  }`}
                ></div>
              </div>
            </label>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter your email"
                />
                <UserCircleIcon className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${
                isReceptionist
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              } disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl disabled:shadow-md flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-500">
                New to UrbanCare?
              </span>
            </div>
          </div>
          <Link
            to="/register"
            className="inline-flex items-center justify-center mt-4 px-6 py-3 border-2 border-gray-200 bg-white/50 hover:bg-white/80 text-gray-700 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg space-x-2"
          >
            <SparklesIcon className="w-5 h-5" />
            <span>Create Account</span>
          </Link>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Admin and staff accounts are pre-assigned by system
              administrators.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Patients and doctors can create accounts using the registration
              form.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
