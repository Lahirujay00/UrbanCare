import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  HeartIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: HeartIcon,
      title: 'Digital Health Cards',
      description: 'Secure digital identification for all patients with QR code access.',
      color: 'text-red-500'
    },
    {
      icon: CalendarIcon,
      title: 'Smart Appointment Booking',
      description: 'Real-time availability and instant payment processing.',
      color: 'text-blue-500'
    },
    {
      icon: DocumentTextIcon,
      title: 'Medical Records Management',
      description: 'Comprehensive digital health records with secure access.',
      color: 'text-green-500'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics & Reports',
      description: 'Advanced reporting tools for healthcare managers.',
      color: 'text-purple-500'
    },
    {
      icon: UserGroupIcon,
      title: 'Multi-Role Support',
      description: 'Designed for patients, doctors, staff, and administrators.',
      color: 'text-yellow-500'
    },
    {
      icon: ShieldCheckIcon,
      title: 'HIPAA Compliant',
      description: 'Enterprise-grade security and compliance standards.',
      color: 'text-indigo-500'
    }
  ];

  const stats = [
    { label: 'Active Patients', value: '10,000+' },
    { label: 'Healthcare Providers', value: '500+' },
    { label: 'Appointments Booked', value: '50,000+' },
    { label: 'System Uptime', value: '99.9%' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Smart Healthcare for
              <span className="block text-blue-200">Urban Communities</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Streamline hospital operations with our comprehensive digital healthcare platform.
              Book appointments, manage records, and access care seamlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="btn btn-lg bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-blue-600 px-8"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="btn btn-lg bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Healthcare Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform provides everything needed for modern healthcare management,
              from patient care to administrative oversight.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow duration-300">
                <div className="card-body">
                  <div className={`w-12 h-12 ${feature.color} mb-4`}>
                    <feature.icon className="w-full h-full" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How UrbanCare Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to get started with digital healthcare management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Register & Verify
              </h3>
              <p className="text-gray-600">
                Create your account and verify your identity to access our secure platform.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Book Appointments
              </h3>
              <p className="text-gray-600">
                Find doctors, check availability, and book appointments with integrated payments.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Access Records
              </h3>
              <p className="text-gray-600">
                View your medical history, prescriptions, and test results securely online.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of patients and healthcare providers who trust UrbanCare
            for their digital healthcare needs.
          </p>
          {!user && (
            <Link
              to="/register"
              className="btn btn-lg bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8"
            >
              Start Your Journey
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;