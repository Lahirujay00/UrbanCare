import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatientIdentification from '../../components/receptionist/PatientIdentification';

// Mock the API
jest.mock('../../services/api', () => ({
  users: {
    searchPatients: jest.fn(),
    verifyHealthCard: jest.fn()
  }
}));

describe('UC03 - Patient Identification Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('UC03-MS4-MS5: Card ID input field renders for staff to enter digital card ID', () => {
    // Act
    render(<PatientIdentification />);

    // Assert
    expect(screen.getByPlaceholderText(/enter health card id/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByText(/patient identification & verification/i)).toBeInTheDocument();
  });

  test('UC03-MS5-MS6-MS7: Valid card ID matches patient and provides visual confirmation', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.users.verifyHealthCard.mockResolvedValue({
      data: {
        success: true,
        patient: {
          firstName: 'John',
          lastName: 'Doe',
          digitalHealthCardId: 'HC123456789',
          phone: '+94770001111',
          dateOfBirth: '1990-01-01',
          email: 'john.doe@example.com'
        }
      }
    });

    render(<PatientIdentification />);

    // Act
    fireEvent.change(screen.getByPlaceholderText(/enter health card id/i), {
      target: { value: 'HC123456789' }
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('HC123456789')).toBeInTheDocument();
      expect(screen.getByText('+94770001111')).toBeInTheDocument();
      expect(screen.getByText(/patient identity confirmed/i)).toBeInTheDocument();
    });
  });

  test('UC03-MS5: Search by patient name or phone number', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.users.searchPatients.mockResolvedValue({
      data: {
        success: true,
        data: [{
          firstName: 'Jane',
          lastName: 'Smith',
          digitalHealthCardId: 'HC987654321',
          phone: '+94770002222',
          email: 'jane.smith@example.com'
        }]
      }
    });

    render(<PatientIdentification />);

    // Act
    fireEvent.change(screen.getByPlaceholderText(/enter health card id/i), {
      target: { value: 'Jane Smith' }
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('HC987654321')).toBeInTheDocument();
    });
  });

  test('UC03-Alt5a: Multiple matches found - prompts staff to confirm with additional info', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.users.searchPatients.mockResolvedValue({
      data: {
        success: true,
        data: [
          {
            firstName: 'John',
            lastName: 'Doe',
            digitalHealthCardId: 'HC123456789',
            phone: '+94770001111',
            dateOfBirth: '1990-01-01'
          },
          {
            firstName: 'John',
            lastName: 'Doe',
            digitalHealthCardId: 'HC111111111',
            phone: '+94770003333',
            dateOfBirth: '1985-05-15'
          }
        ]
      }
    });

    render(<PatientIdentification />);

    // Act
    fireEvent.change(screen.getByPlaceholderText(/enter health card id/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getAllByText('John Doe')).toHaveLength(2);
      expect(screen.getByText('+94770001111')).toBeInTheDocument();
      expect(screen.getByText('+94770003333')).toBeInTheDocument();
      expect(screen.getByText('1990-01-01')).toBeInTheDocument();
      expect(screen.getByText('1985-05-15')).toBeInTheDocument();
      expect(screen.getByText(/multiple patients found\. please verify additional details\./i)).toBeInTheDocument();
    });
  });

  test('UC03-Alt6a-Alt7a: Card ID not recognized - shows error message with retry option', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.users.verifyHealthCard.mockRejectedValue({
      response: { data: { message: 'Patient not found' } }
    });

    render(<PatientIdentification />);

    // Act
    fireEvent.change(screen.getByPlaceholderText(/enter health card id/i), {
      target: { value: 'HC999999999' }
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/patient not found/i)).toBeInTheDocument();
      expect(screen.getByText(/please check the card id and try again/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  test('UC03-Alt6a: Manual entry fallback when card ID fails', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.users.verifyHealthCard.mockRejectedValue({
      response: { data: { message: 'Patient not found' } }
    });

    render(<PatientIdentification />);

    // Act
    fireEvent.change(screen.getByPlaceholderText(/enter health card id/i), {
      target: { value: 'HC999999999' }
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/manual entry/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter patient name or phone/i)).toBeInTheDocument();
    });
  });

  test('UC03-Exception1: Unauthorized access attempt - shows access denied', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.users.verifyHealthCard.mockRejectedValue({
      response: { status: 401, data: { message: 'Access denied' } }
    });

    render(<PatientIdentification />);

    // Act
    fireEvent.change(screen.getByPlaceholderText(/enter health card id/i), {
      target: { value: 'HC123456789' }
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.getByText(/you do not have permission to access patient records/i)).toBeInTheDocument();
    });
  });

  test('UC03-Exception2: System offline - network failure shows manual entry option', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.users.verifyHealthCard.mockRejectedValue(new Error('Network Error'));

    render(<PatientIdentification />);

    // Act
    fireEvent.change(screen.getByPlaceholderText(/enter health card id/i), {
      target: { value: 'HC123456789' }
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/system offline/i)).toBeInTheDocument();
      expect(screen.getByText(/please record patient details manually/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /manual entry/i })).toBeInTheDocument();
    });
  });

  test('UC03-Exception3: System database error - shows manual entry option', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.users.verifyHealthCard.mockRejectedValue({
      response: { status: 500, data: { message: 'Database error' } }
    });

    render(<PatientIdentification />);

    // Act
    fireEvent.change(screen.getByPlaceholderText(/enter health card id/i), {
      target: { value: 'HC123456789' }
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/database temporarily unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/please use manual entry to record patient details/i)).toBeInTheDocument();
    });
  });

  test('UC03-Edge: Empty search query shows validation error', async () => {
    // Act
    render(<PatientIdentification />);

    fireEvent.change(screen.getByPlaceholderText(/enter health card id/i), {
      target: { value: '' }
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/please enter a health card id or patient details/i)).toBeInTheDocument();
    });
  });

  test('UC03-Edge: Invalid card ID format validation', async () => {
    // Act
    render(<PatientIdentification />);

    fireEvent.change(screen.getByPlaceholderText(/enter health card id/i), {
      target: { value: 'INVALID' }
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/invalid health card id format/i)).toBeInTheDocument();
    });
  });

  test('UC03-Edge: Loading state during search', async () => {
    // Arrange
    const mockApi = require('../../services/api');
    mockApi.users.verifyHealthCard.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        data: {
          success: true,
          patient: {
            firstName: 'John',
            lastName: 'Doe',
            digitalHealthCardId: 'HC123456789'
          }
        }
      }), 100))
    );

    render(<PatientIdentification />);

    // Act
    fireEvent.change(screen.getByPlaceholderText(/enter health card id/i), {
      target: { value: 'HC123456789' }
    });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    // Assert - Loading state
    expect(screen.getByText(/verifying patient identity/i)).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});