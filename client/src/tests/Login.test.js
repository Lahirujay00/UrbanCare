import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import Login from '../../pages/auth/Login';

// Mock the API
jest.mock('../../services/api', () => ({
  auth: {
    login: jest.fn(),
    getCurrentUser: jest.fn()
  }
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('UC03 - Patient Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('UC03-MS1-MS2-MS3: Patient login form renders with digital card access', () => {
    // Act
    renderLogin();

    // Assert
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/login to access your digital health card/i)).toBeInTheDocument();
  });

  test('UC03-MS1: Successful patient login redirects to dashboard with digital card access', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.auth.login.mockResolvedValue({
      data: {
        success: true,
        user: {
          role: 'patient',
          email: 'patient@example.com',
          digitalHealthCardId: 'HC123456789',
          firstName: 'John',
          lastName: 'Doe'
        },
        token: 'mock-token'
      }
    });

    renderLogin();

    // Act
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'patient@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Patient123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
    expect(mockApi.auth.login).toHaveBeenCalledWith({
      email: 'patient@example.com',
      password: 'Patient123!'
    });
  });

  test('UC03-MS2-MS3: Login provides access to digital health card', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.auth.login.mockResolvedValue({
      data: {
        success: true,
        user: {
          role: 'patient',
          email: 'patient@example.com',
          digitalHealthCardId: 'HC123456789',
          firstName: 'John',
          lastName: 'Doe'
        },
        token: 'mock-token'
      }
    });
    mockApi.auth.getCurrentUser.mockResolvedValue({
      data: {
        user: {
          digitalHealthCardId: 'HC123456789',
          firstName: 'John',
          lastName: 'Doe'
        }
      }
    });

    renderLogin();

    // Act
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'patient@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Patient123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('UC03-Exception1: Invalid credentials show error message', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.auth.login.mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } }
    });

    renderLogin();

    // Act
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'WrongPassword!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  test('UC03-Exception1: Unauthorized access attempt - inactive account', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.auth.login.mockRejectedValue({
      response: { data: { message: 'Account is inactive' } }
    });

    renderLogin();

    // Act
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'inactive@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Patient123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/account is inactive/i)).toBeInTheDocument();
    });
  });

  test('UC03-Exception2: System offline - network error shows offline message', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.auth.login.mockRejectedValue(new Error('Network Error'));

    renderLogin();

    // Act
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'patient@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Patient123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  test('UC03-Exception2: System offline - server error shows offline message', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.auth.login.mockRejectedValue({
      response: { status: 500, data: { message: 'Internal server error' } }
    });

    renderLogin();

    // Act
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'patient@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Patient123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/system is currently offline/i)).toBeInTheDocument();
    });
  });

  test('UC03-Edge: Form validation - empty email', async () => {
    // Act
    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: '' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Patient123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  test('UC03-Edge: Form validation - empty password', async () => {
    // Act
    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'patient@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('UC03-Edge: Form validation - invalid email format', async () => {
    // Act
    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Patient123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });
});