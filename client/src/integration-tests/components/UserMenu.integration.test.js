import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import UserMenu from '../../components/UserMenu';

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/user/profile']}>
      <UserMenu />
      <Routes>
        <Route
          path="/dashboard/user/profile"
          element={<div data-testid="profile-page">Profile Page</div>}
        />
        <Route
          path="/dashboard/user/orders"
          element={<div data-testid="orders-page">Orders Page</div>}
        />
      </Routes>
    </MemoryRouter>
  );

describe('UserMenu Component - Integration with Profile/Orders', () => {
  test('renders properly with 2 links', () => {
    // Arrange + Act
    renderWithRouter();

    // Assert
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    const profileLink = screen.getByRole('link', { name: /profile/i });
    const ordersLink = screen.getByRole('link', { name: /orders/i });

    expect(profileLink).toBeInTheDocument();
    expect(ordersLink).toBeInTheDocument();

    expect(profileLink).toHaveAttribute('href', '/dashboard/user/profile');
    expect(ordersLink).toHaveAttribute('href', '/dashboard/user/orders');
  });

  test('navigates to Orders when link is clicked', () => {
    // Arrange
    renderWithRouter();

    // Act
    fireEvent.click(screen.getByRole('link', { name: /orders/i }));

    // Assert
    expect(screen.getByTestId('orders-page')).toBeInTheDocument();
  });

  test('navigates to Profile when link is clicked', () => {
    // Arrange
    renderWithRouter();

    // Act
    fireEvent.click(screen.getByRole('link', { name: /profile/i }));

    // Assert
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();
  });
});
