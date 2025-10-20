import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast, { Toaster } from 'react-hot-toast';
import Login from '../../../pages/Auth/Login';
import ForgotPassword from '../../../pages/Auth/ForgotPassword';
import HomePage from '../../../pages/HomePage';
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

const TestLoginComponent = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Toaster />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/" element={<HomePage />} />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
}

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.getItem.mockReset();
    window.localStorage.setItem.mockReset();
    window.localStorage.removeItem.mockReset();
  });

  it('renders login form', () => {
    const { getByPlaceholderText, getByText } = render(<TestLoginComponent />);
    expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
    expect(getByText('Forgot Password')).toBeInTheDocument();
    expect(getByText('LOGIN')).toBeInTheDocument();
  });

  it('should navigate to forgot password page on clicking forgot password button', async () => {
    const { getByText } = render(<TestLoginComponent />);
    fireEvent.click(getByText('Forgot Password'));
    await waitFor(() => {
      expect(getByText('SET NEW PASSWORD')).toBeInTheDocument();
    });
  });

  it('should login successfully and redirect to home page', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'login successfully',
        user: { name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken',
      },
    };
    axios.post.mockResolvedValueOnce(mockResponse);

    const { getByPlaceholderText, getByText } = render(<TestLoginComponent />);

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('login successfully', expect.any(Object));
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'auth',
        JSON.stringify(mockResponse.data)
      );
    });
  });

  it('should show error toast on login failure', async () => {
    const mockErrorResponse = {
      data: {
        success: false,
        message: 'Invalid credentials',
      },
    };
    axios.post.mockResolvedValueOnce(mockErrorResponse);

    const { getByPlaceholderText, getByText } = render(<TestLoginComponent />);

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
      expect(getByText('Login')).toBeInTheDocument();
    });
  });

  it('should show generic error toast when API request fails', async () => {
    axios.post.mockRejectedValueOnce({ message: 'Invalid credentials' });
    const { getByPlaceholderText, getByText } = render(<TestLoginComponent />);

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      expect(window.localStorage.setItem).not.toHaveBeenCalled();
      expect(getByText('Login')).toBeInTheDocument();
    });
  });
});