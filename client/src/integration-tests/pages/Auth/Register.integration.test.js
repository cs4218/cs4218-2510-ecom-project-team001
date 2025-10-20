import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import  toast, { Toaster } from 'react-hot-toast';
import Register from '../../../pages/Auth/Register';
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

const TestRegisterComponent = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={['/register']}>
            <Toaster />
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
}

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.getItem.mockReset();
    window.localStorage.setItem.mockReset();
    window.localStorage.removeItem.mockReset();
  });

  it('renders register form', () => {
    const { getByText, getByPlaceholderText } = render(<TestRegisterComponent />);
    expect(getByText('REGISTER FORM')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Name')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Phone')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Address')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your DOB')).toBeInTheDocument();
    expect(getByPlaceholderText('What is Your Favorite sports')).toBeInTheDocument();
  });

  it('should allow typing in all input fields', () => {
    const { getByPlaceholderText } = render(<TestRegisterComponent />);
    const nameInput = getByPlaceholderText('Enter Your Name');
    const emailInput = getByPlaceholderText('Enter Your Email');
    const passwordInput = getByPlaceholderText('Enter Your Password');
    const phoneInput = getByPlaceholderText('Enter Your Phone');
    const addressInput = getByPlaceholderText('Enter Your Address');
    const dobInput = getByPlaceholderText('Enter Your DOB');
    const answerInput = getByPlaceholderText('What is Your Favorite sports');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(addressInput, { target: { value: '123 Street' } });
    fireEvent.change(dobInput, { target: { value: '2000-01-01' } });
    fireEvent.change(answerInput, { target: { value: 'Football' } });

    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
    expect(phoneInput.value).toBe('1234567890');
    expect(addressInput.value).toBe('123 Street');
    expect(dobInput.value).toBe('2000-01-01');
    expect(answerInput.value).toBe('Football');
  });

  it('should show error toast for invalid phone number', async () => {
    const { getByPlaceholderText, getByText } = render(<TestRegisterComponent />);
    fireEvent.change(getByPlaceholderText('Enter Your Name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
      target: { value: 'invalid-phone' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), {
      target: { value: '123 Street' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), {
      target: { value: '2000-01-01' },
    });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), {
      target: { value: 'Football' },
    });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter a valid phone number.');
    });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should show error toast for future DOB', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDOB = [
      futureDate.getFullYear(),
      String(futureDate.getMonth() + 1).padStart(2, '0'),
      String(futureDate.getDate()).padStart(2, '0'),
    ].join('-');

    const { getByPlaceholderText, getByText } = render(<TestRegisterComponent />);
    fireEvent.change(getByPlaceholderText('Enter Your Name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
      target: { value: '1234567890' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), {
      target: { value: '123 Street' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), {
      target: { value: futureDOB },
    });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), {
      target: { value: 'Football' },
    });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Date of birth cannot be a future date.');
    });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should register the user successfully and navigate to login', async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: 'Register Successfully, please login' },
    });

    const { getByPlaceholderText, getByText, findByText } = render(<TestRegisterComponent />);
    fireEvent.change(getByPlaceholderText('Enter Your Name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
      target: { value: '1234567890' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), {
      target: { value: '123 Street' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), {
      target: { value: '2000-01-01' },
    });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), {
      target: { value: 'Football' },
    });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/register', {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        address: '123 Street',
        DOB: '2000-01-01',
        answer: 'Football',
      });
    });

    await findByText('LOGIN FORM');
    expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
  });

  it('should show a generic error toast when API request fails', async () => {
    axios.post.mockRejectedValueOnce({ message: 'User already exists' });

    const { getByPlaceholderText, getByText } = render(<TestRegisterComponent />);
    fireEvent.change(getByPlaceholderText('Enter Your Name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
      target: { value: '1234567890' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), {
      target: { value: '123 Street' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), {
      target: { value: '2000-01-01' },
    });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), {
      target: { value: 'Football' },
    });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('should show error toast when API responds with an error', async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: 'User already exists' },
    });

    const { getByPlaceholderText, getByText } = render(<TestRegisterComponent />);
    fireEvent.change(getByPlaceholderText('Enter Your Name'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), {
      target: { value: '1234567890' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), {
      target: { value: '123 Street' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your DOB'), {
      target: { value: '2000-01-01' },
    });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), {
      target: { value: 'Football' },
    });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
    expect(toast.error).toHaveBeenCalledWith('User already exists');
  });
});