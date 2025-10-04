import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import ForgotPassword from './ForgotPassword';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]), // Mock useAuth hook to return null state and a mock function for setAuth
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

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.getItem.mockReset();
    window.localStorage.setItem.mockReset();
    window.localStorage.removeItem.mockReset();
  });

  it('renders forgot password form', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByText('FORGOT PASSWORD FORM')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
    expect(getByPlaceholderText('Enter Your New Password')).toBeInTheDocument();
    expect(getByPlaceholderText('Confirm Your New Password')).toBeInTheDocument();
    expect(getByPlaceholderText('What is your favorite sport?')).toBeInTheDocument();
  });

  it('inputs should be initially empty', () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByPlaceholderText('Enter Your Email').value).toBe('');
    expect(getByPlaceholderText('Enter Your New Password').value).toBe('');
    expect(getByPlaceholderText('Confirm Your New Password').value).toBe('');
    expect(getByPlaceholderText('What is your favorite sport?').value).toBe('');
  });

  it('should show error toast if passwords do not match', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(getByPlaceholderText('Confirm Your New Password'), {
      target: { value: 'differentpassword' },
    });
    fireEvent.change(getByPlaceholderText('What is your favorite sport?'), {
      target: { value: 'Football' },
    });

    fireEvent.click(getByText('SET NEW PASSWORD'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match.');
    });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should reset password successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, message: 'Password reset successful, please login' } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(getByPlaceholderText('Confirm Your New Password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(getByPlaceholderText('What is your favorite sport?'), {
      target: { value: 'Football' },
    });

    fireEvent.click(getByText('SET NEW PASSWORD'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Password reset successful, please login');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should show error toast on failed password reset', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: false, message: 'Error in resetting password' } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(getByPlaceholderText('Confirm Your New Password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(getByPlaceholderText('What is your favorite sport?'), {
      target: { value: 'Football' },
    });

    fireEvent.click(getByText('SET NEW PASSWORD'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Error in resetting password');
  });

  it('inputs should update on change', () => {
    const { getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    const emailInput = getByPlaceholderText('Enter Your Email');
    const passwordInput = getByPlaceholderText('Enter Your New Password');
    const confirmPasswordInput = getByPlaceholderText('Confirm Your New Password');
    const answerInput = getByPlaceholderText('What is your favorite sport?');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(answerInput, { target: { value: 'Football' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('newpassword123');
    expect(confirmPasswordInput.value).toBe('newpassword123');
    expect(answerInput.value).toBe('Football');
  });

  it('should show error toast if forgot password response is unsuccessful', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Error'));

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(getByPlaceholderText('Confirm Your New Password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(getByPlaceholderText('What is your favorite sport?'), {
      target: { value: 'Football' },
    });

    fireEvent.click(getByText('SET NEW PASSWORD'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Error in resetting password');
  });

  it('should not call axios.post if required fields are empty', async () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(getByText('SET NEW PASSWORD'));

    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  it('should trim input values before submission', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, message: 'Password reset successful, please login' } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), {
      target: { value: '   test@example.com   ' },
    });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(getByPlaceholderText('Confirm Your New Password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(getByPlaceholderText('What is your favorite sport?'), {
      target: { value: '   Football   ' },
    });

    fireEvent.click(getByText('SET NEW PASSWORD'));

    await waitFor(() => expect(axios.post).toHaveBeenCalledWith(
      '/api/v1/auth/forgot-password',
      {
        email: 'test@example.com',
        newPassword: 'newpassword123',
        answer: 'Football',
      }
    ));
    expect(toast.success).toHaveBeenCalledWith('Password reset successful, please login');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should display loading state on the submit button during form submission', async () => {
    axios.post.mockReturnValue(new Promise(() => {}));

    const { getByRole, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(getByPlaceholderText('What is your favorite sport?'), { target: { value: 'Football' } });
    fireEvent.change(getByPlaceholderText('Enter Your New Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Confirm Your New Password'), { target: { value: 'password123' } });

    const submitButton = getByRole('button', { name: /set new password/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      const loadingButton = getByRole('button', { name: /processing.../i });
      expect(loadingButton).toBeInTheDocument();
      expect(loadingButton).toBeDisabled();
    });
  });
});