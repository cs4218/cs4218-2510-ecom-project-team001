import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast, { Toaster } from 'react-hot-toast';
import ForgotPassword from '../../../pages/Auth/ForgotPassword';
import Login from '../../../pages/Auth/Login';
import { AuthProvider } from '../../../context/auth';
import { CartProvider } from '../../../context/cart';
import { SearchProvider } from '../../../context/search';

jest.mock('axios');
jest.mock('react-hot-toast');

Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

const TestForgotPasswordComponent = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={['/forgot-password']}>
            <Toaster />
            <Routes>
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
}

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.getItem.mockReset();
    window.localStorage.setItem.mockReset();
    window.localStorage.removeItem.mockReset();
  });

  it('renders forgot password form', () => {
    const { getByPlaceholderText, getByText } = render(<TestForgotPasswordComponent />);
    expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(getByPlaceholderText('What is your favorite sport?')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your New Password')).toBeInTheDocument();
    expect(getByPlaceholderText('Confirm Your New Password')).toBeInTheDocument();
    expect(getByText('SET NEW PASSWORD')).toBeInTheDocument();
  });

  it('shows error toast if passwords do not match', async () => {
    const { getByPlaceholderText, getByText } = render(<TestForgotPasswordComponent />);
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('What is your favorite sport?'), { target: { value: 'Football' } });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), { target: { value: 'newpassword123' } });
    fireEvent.change(getByPlaceholderText('Confirm Your New Password'), { target: { value: 'differentpass' } });
    fireEvent.click(getByText('SET NEW PASSWORD'));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match.');
    });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('submits forgot password form successfully and redirects to login', async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true }
    });
    const { getByPlaceholderText, getByText } = render(<TestForgotPasswordComponent />);
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('What is your favorite sport?'), { target: { value: 'Football' } });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), { target: { value: 'newpass123' } });
    fireEvent.change(getByPlaceholderText('Confirm Your New Password'), { target: { value: 'newpass123' } });
    fireEvent.click(getByText('SET NEW PASSWORD'));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Password reset successful, please login');
    });
  });

  it('shows error toast on failed password reset', async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: 'Error in resetting password' }
    });
    const { getByPlaceholderText, getByText } = render(<TestForgotPasswordComponent />);
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('What is your favorite sport?'), { target: { value: 'Football' } });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), { target: { value: 'newpassword123' } });
    fireEvent.change(getByPlaceholderText('Confirm Your New Password'), { target: { value: 'newpassword123' } });
    fireEvent.click(getByText('SET NEW PASSWORD'));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Error in resetting password');
    });
  });
});