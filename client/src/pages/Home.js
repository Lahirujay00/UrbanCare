import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  PhoneIcon,
  ClockIcon,
  MapPinIcon,
  ChevronRightIcon,
  HeartIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Schedule Appointment',
      description: 'Book with our healthcare providers',
      icon: CalendarIcon,
      link: user ? '/patient/appointment-booking' : '/register',
      color: 'bg-blue-600'
    },
    {
      title: 'Find a Doctor',
      description: 'Search our network of specialists',
      icon: UserGroupIcon,
      link: '/doctors',
      color: 'bg-teal-600'
    },
    {
      title: 'Medical Records',
      description: 'Access your health information',
      icon: DocumentTextIcon,
      link: user ? '/patient/medical-records' : '/login',
      color: 'bg-green-600'
    }
  ];

  const services = [
    {
      title: 'Primary Care',
      description: 'Comprehensive healthcare for your everyday needs'
    },
    {
      title: 'Specialist Care',
      description: 'Expert care from board-certified specialists'
    },
    {
      title: 'Emergency Services',
      description: '24/7 emergency and urgent care services'
    },
    {
      title: 'Preventive Care',
      description: 'Regular check-ups and health screenings'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img src="/logo.svg" alt="UrbanCare" className="h-16 w-auto" />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-blue-600"></div>
              </div>
            </div>
            
            <div className="mb-4">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mb-4">
                ✨ Trusted by 10,000+ Patients
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Modern Healthcare for
              <br />
              <span className="text-blue-600">Urban Communities</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              Experience seamless healthcare with our comprehensive digital platform. 
              Book appointments instantly, access your medical records securely, and connect with 
              board-certified healthcare providers—all in one place.
            </p>
            
            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="group bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100"
                >
                  <div className={`inline-flex p-3 rounded-lg ${action.color} text-white mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{action.description}</p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    Get Started <ChevronRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Primary CTA */}
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className="h-5 w-5" />
              <span className="text-sm font-medium">HIPAA Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Board Certified Doctors</span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5" />
              <span className="text-sm font-medium">24/7 Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <HeartIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Patient-Centered Care</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-full mb-4">
              Our Services
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Comprehensive Healthcare Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From preventive care to specialized treatments, we offer a full spectrum of 
              healthcare services tailored to meet your unique needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Primary Care',
                description: 'Comprehensive healthcare for your everyday wellness needs with experienced family physicians',
                icon: '🩺',
                color: 'blue'
              },
              {
                title: 'Specialist Care',
                description: 'Expert care from board-certified specialists across 25+ medical specialties',
                icon: '👨‍⚕️',
                color: 'teal'
              },
              {
                title: 'Emergency Services',
                description: '24/7 emergency and urgent care services with rapid response capabilities',
                icon: '🚑',
                color: 'red'
              },
              {
                title: 'Preventive Care',
                description: 'Regular health screenings, vaccinations, and wellness programs to keep you healthy',
                icon: '🛡️',
                color: 'green'
              }
            ].map((service, index) => (
              <div key={index} className="group relative bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-200">
                <div className="text-center">
                  <div className={`w-20 h-20 bg-${service.color}-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-3xl">{service.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>
                  <button className={`text-${service.color}-600 font-medium text-sm flex items-center mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    Learn More
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-${service.color}-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl`}></div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Link 
              to="/services" 
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              View All Services
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Trusted by Our Community</h2>
            <p className="text-xl text-blue-100">Delivering quality healthcare to urban communities</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">Patients Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Healthcare Providers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-blue-100">Appointments Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">System Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-full mb-4">
              Simple Process
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Getting Started is Easy</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Begin your healthcare journey in just three simple steps. 
              Our streamlined process gets you connected to quality care quickly and efficiently.
            </p>
          </div>
          
          <div className="relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
              <div className="flex justify-between items-center px-16">
                <div className="w-1/3 h-0.5 bg-gradient-to-r from-blue-200 to-teal-300"></div>
                <div className="w-1/3 h-0.5 bg-gradient-to-r from-teal-300 to-green-200"></div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {[
                {
                  step: '1',
                  title: 'Create Your Account',
                  description: 'Sign up in under 2 minutes with secure verification. Complete your health profile and insurance information.',
                  icon: '👤',
                  color: 'blue',
                  action: 'Sign Up Now'
                },
                {
                  step: '2', 
                  title: 'Book Your Appointment',
                  description: 'Browse available providers, select your preferred time slot, and book instantly with real-time scheduling.',
                  icon: '📅',
                  color: 'teal',
                  action: 'Schedule Now'
                },
                {
                  step: '3',
                  title: 'Receive Quality Care',
                  description: 'Meet with your healthcare provider, get treatment, and access all your records through our secure portal.',
                  icon: '🏥',
                  color: 'green',
                  action: 'Learn More'
                }
              ].map((item, index) => (
                <div key={index} className="text-center group">
                  <div className="relative mb-8">
                    <div className={`w-20 h-20 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                      {item.step}
                    </div>
                    <div className={`absolute -top-2 -right-2 w-8 h-8 bg-${item.color}-100 rounded-full flex items-center justify-center group-hover:scale-125 transition-transform duration-300`}>
                      <span className="text-lg">{item.icon}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6 px-4">{item.description}</p>
                  <button className={`text-${item.color}-600 font-semibold text-sm px-6 py-2 border border-${item.color}-200 rounded-full hover:bg-${item.color}-50 transition-colors duration-200`}>
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-16">
            <div className="bg-blue-50 rounded-2xl p-8 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to get started?</h3>
              <p className="text-gray-600 mb-4">Join thousands of patients who trust UrbanCare for their healthcare needs</p>
              <Link 
                to="/register" 
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Create Free Account
                <ChevronRightIcon className="h-5 w-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-orange-50 text-orange-700 text-sm font-medium rounded-full mb-4">
              We're Here to Help
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Need Help Getting Started?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our dedicated support team is available to guide you through every step of your healthcare journey. 
              Get personalized assistance when you need it most.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: PhoneIcon,
                title: 'Call Our Support Team',
                description: 'Speak directly with our healthcare support specialists for immediate assistance',
                contact: '(555) 123-4567',
                action: 'Call Now',
                color: 'blue',
                badge: '24/7 Available'
              },
              {
                icon: ClockIcon,
                title: 'Office Hours & Scheduling',
                description: 'Flexible hours to accommodate your busy schedule with same-day appointments',
                contact: 'Mon-Fri: 7AM - 8PM\nSat-Sun: 9AM - 5PM',
                action: 'View Schedule',
                color: 'green',
                badge: 'Extended Hours'
              },
              {
                icon: MapPinIcon,
                title: 'Find Nearby Locations',
                description: 'Multiple convenient locations throughout the city with easy parking and accessibility',
                contact: '15+ Locations',
                action: 'Find Locations',
                color: 'teal',
                badge: 'Expanding Network'
              }
            ].map((item, index) => (
              <div key={index} className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className={`w-16 h-16 bg-${item.color}-50 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-${item.color}-100 transition-colors duration-300`}>
                      <item.icon className={`h-8 w-8 text-${item.color}-600`} />
                    </div>
                    <span className={`absolute -top-2 -right-2 px-2 py-1 bg-${item.color}-500 text-white text-xs font-medium rounded-full`}>
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{item.description}</p>
                  <div className={`text-${item.color}-600 font-semibold mb-6 whitespace-pre-line`}>
                    {item.contact}
                  </div>
                  <button className={`w-full px-6 py-3 bg-${item.color}-600 text-white font-semibold rounded-lg hover:bg-${item.color}-700 transition-colors duration-200 flex items-center justify-center`}>
                    {item.action}
                    <ChevronRightIcon className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* FAQ Quick Links */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
              <p className="text-gray-600">Quick answers to common questions about getting started</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              {[
                'How do I register?',
                'Insurance coverage?', 
                'Appointment booking?',
                'Medical records access?'
              ].map((question, index) => (
                <button key={index} className="px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 text-sm font-medium">
                  {question}
                </button>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link 
                to="/faq" 
                className="text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200"
              >
                View All FAQs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Experience Better Healthcare?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of patients who trust UrbanCare for their healthcare needs
          </p>
          
          {!user ? (
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Get Started Today
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="inline-block px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;