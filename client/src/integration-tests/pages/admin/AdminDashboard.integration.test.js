import React from 'react';
import { render, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import AdminDashboard from '../../../pages/admin/AdminDashboard';
import { AuthProvider } from '../../../context/auth';
import { CartProvider } from '../../../context/cart';
import { SearchProvider } from '../../../context/search';

jest.mock('axios');

jest.mock('../../../components/AdminMenu', () => () => (
  <div>
    <h4>Admin Panel</h4>
    <a href="/dashboard/admin/create-category">Create Category</a>
    <a href="/dashboard/admin/create-product">Create Product</a>
    <a href="/dashboard/admin/products">Products</a>
    <a href="/dashboard/admin/orders">Orders</a>
  </div>
));

jest.mock('../../../components/Layout', () => ({ children }) => <div>{children}</div>);

const mockUseAuth = jest.fn();

const TestAdminDashboardComponent = () => {
  const mockAuth = {
    user: {
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '1234567890',
      role: 1,
    },
    token: 'mock-token',
  };
  mockUseAuth.mockReturnValue([mockAuth, jest.fn()]);

  jest.spyOn(require('../../../context/auth'), 'useAuth').mockImplementation(mockUseAuth);

  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={['/dashboard/admin']}>
            <Routes>
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
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
    const { getByText, getByRole } = render(<TestAdminDashboardComponent />);

    await waitFor(() => {
      expect(getByRole('heading', { level: 4, name: 'Admin Panel' })).toBeInTheDocument();
    });

    expect(getByText('Create Category')).toBeInTheDocument();
    expect(getByText('Create Product')).toBeInTheDocument();
    expect(getByText('Products')).toBeInTheDocument();
    expect(getByText('Orders')).toBeInTheDocument();

    expect(getByText('Admin Name : Admin User')).toBeInTheDocument();
    expect(getByText('Admin Email : admin@example.com')).toBeInTheDocument();
    expect(getByText('Admin Contact : 1234567890')).toBeInTheDocument();
  });
});