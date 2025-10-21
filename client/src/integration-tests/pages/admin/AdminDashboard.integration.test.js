import React from 'react';
import { render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import AdminDashboard from '../../../pages/admin/AdminDashboard';
import AdminRoute from '../../../components/Routes/AdminRoute';
import { AuthProvider } from '../../../context/auth';
import { CartProvider } from '../../../context/cart';
import { SearchProvider } from '../../../context/search';

jest.mock('axios');

jest.mock('../../../context/auth', () => ({
  useAuth: () => [
    {
      user: {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '1234567890',
        role: 1,
      },
      token: 'mock-token',
    },
    jest.fn(),
  ],
}));

const TestAdminDashboardComponent = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={['/dashboard/admin']}>
            <Routes>
              <Route element={<AdminRoute />}>
                <Route path="/dashboard/admin" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

describe('AdminDashboard Page - Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { success: true } });
  });

  it('renders admin dashboard with admin details', async () => {
    const { getByText } = render(<TestAdminDashboardComponent />);

    await waitFor(() => {
      expect(getByRole('heading', { level: 4, name: 'Admin Panel' })).toBeInTheDocument();
    });

    expect(getByText('Create Category')).toBeInTheDocument();
    expect(getByText('Create Product')).toBeInTheDocument();
    expect(getByText('Products')).toBeInTheDocument();
    expect(getByText('Orders')).toBeInTheDocument();

    expect(getByText('Admin Name : Admin User')).toBeInTheDocument();
    expect(getByText('Admin Email : admin@example.com')).toBeInTheDocument();
    expect(getByText('Admin Phone : 1234567890')).toBeInTheDocument();
    expect(getByText('Admin Role : Admin')).toBeInTheDocument();
  });
});