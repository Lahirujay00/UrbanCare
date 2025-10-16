import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  loading: true,
  isAuthenticated: false,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
      };
    case 'AUTH_FAIL':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isChecking, setIsChecking] = React.useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      // Prevent duplicate simultaneous auth checks
      if (isChecking) return;
      
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          setIsChecking(true);
          const response = await authAPI.getMe();
          if (response.data.success) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: response.data.data.user,
                token,
                refreshToken: localStorage.getItem('refreshToken'),
              },
            });
          } else {
            throw new Error('Failed to authenticate');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          dispatch({ type: 'AUTH_FAIL' });
        } finally {
          setIsChecking(false);
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authAPI.login({ email, password });
      
      if (response.data.success) {
        const { user, token, refreshToken } = response.data.data;
        
        // Store tokens in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token, refreshToken },
        });
        
        toast.success('Login successful!');
        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAIL' });
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authAPI.register(userData);
      
      if (response.data.success) {
        const { user, token, refreshToken } = response.data.data;
        
        // Store tokens in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token, refreshToken },
        });
        
        toast.success('Registration successful! Please check your email for verification.');
        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAIL' });
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Remove tokens from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword({ email });
      
      if (response.data.success) {
        toast.success('Password reset link sent to your email');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Failed to send reset email');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to send reset email';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      const response = await authAPI.resetPassword(token, { password });
      
      if (response.data.success) {
        toast.success('Password reset successful! Please login with your new password.');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Password reset failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Password reset failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Verify email
  const verifyEmail = async (token) => {
    try {
      const response = await authAPI.verifyEmail(token);
      
      if (response.data.success) {
        toast.success('Email verified successfully!');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Email verification failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Email verification failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    forgotPassword,
    resetPassword,
    verifyEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;