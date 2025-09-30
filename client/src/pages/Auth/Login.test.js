import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Login from './Login';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

const mockSetAuth = jest.fn();
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, mockSetAuth]), // Mock useAuth hook to return null state and a mock function for setAuth
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]), // Mock useCart hook to return null state and a mock function
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]), // Mock useSearch hook to return null state and a mock function
}));

jest.mock('../../hooks/useCategory', () => jest.fn(() => [])); // Mock useCategory hook to return empty arrays

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(),
}));

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

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.getItem.mockReset();
    window.localStorage.setItem.mockReset();
    window.localStorage.removeItem.mockReset();
  });

  it('renders login form', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('LOGIN FORM')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
  });

  it('inputs should be initially empty', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('LOGIN FORM')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email').value).toBe('');
    expect(getByPlaceholderText('Enter Your Password').value).toBe('');
  });

  it('should allow typing email and password', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );
    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    expect(getByPlaceholderText('Enter Your Email').value).toBe(
      'test@example.com'
    );
    expect(getByPlaceholderText('Enter Your Password').value).toBe(
      'password123'
    );
  });

  it('should login the user successfully', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Login successful',
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken',
      },
    });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Login successful', {
      duration: 5000,
      icon: '🙏',
      style: {
        background: 'green',
        color: 'white',
      },
    });
    expect(mockSetAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken',
      })
    );
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "auth",
      JSON.stringify({
        success: true,
        message: 'Login successful',
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: "mockToken",
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should display error message on failed login', async () => {
    axios.post.mockRejectedValueOnce({ message: 'Invalid credentials' });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  it('should show error toast if login response is unsuccessful', async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: 'Invalid credentials' },
    });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
  });

  it('should navigate to forgot-password page when Forgot Password is clicked', () => {
    const { getByText } = render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

    fireEvent.click(getByText('Forgot Password'));

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('should trim input values before submission', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Login successful',
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken',
      },
    });

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: '  test@example.com  ' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    }));
    expect(toast.success).toHaveBeenCalledWith('Login successful', {
      duration: 5000,
      icon: '🙏',
      style: {
        background: 'green',
        color: 'white',
      },
    });
    expect(mockSetAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken',
      })
    );
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "auth",
      JSON.stringify({
        success: true,
        message: 'Login successful',
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: "mockToken",
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should navigate to location.state.from when provided', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Login successful',
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken',
      },
    });

    const mockFromPath = '/admin';
    const mockLocation = { state: { from: { pathname: mockFromPath } } };
    useLocation.mockReturnValue(mockLocation);

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(getByText('LOGIN'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Login successful', {
      duration: 5000,
      icon: '🙏',
      style: {
        background: 'green',
        color: 'white',
      },
    });
    expect(mockSetAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: 'mockToken',
      })
    );
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "auth",
      JSON.stringify({
        success: true,
        message: 'Login successful',
        user: { id: 1, name: 'John Doe', email: 'test@example.com' },
        token: "mockToken",
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith(mockFromPath);
  });
});
