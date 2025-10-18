import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from '../../../context/auth';
import Dashboard from '../../../pages/user/Dashboard';

jest.mock('../../../components/Layout', () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

const renderDashboard = (initialAuth = null) => {
  if (initialAuth) {
    localStorage.setItem('auth', JSON.stringify(initialAuth));
  } else {
    localStorage.removeItem('auth');
  }

  return render(
    <MemoryRouter initialEntries={['/dashboard/user']}>
      <AuthProvider>
        <Routes>
          <Route path="/dashboard/user" element={<Dashboard />} />
          <Route
            path="/dashboard/user/profile"
            element={<div data-testid="profile-page">Profile Page</div>}
          />
          <Route
            path="/dashboard/user/orders"
            element={<div data-testid="orders-page">Orders Page</div>}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('User Dashboard - Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Quiet logs
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  test('renders UserMenu within Dashboard with correct links', () => {
    // Arrange + Act
    renderDashboard({
      user: { name: 'NUS Student' },
      token: 'test-nonce',
    });

    // Assert
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    const profileLink = screen.getByRole('link', { name: /^profile$/i });
    const ordersLink = screen.getByRole('link', { name: /^orders$/i });

    expect(profileLink).toBeInTheDocument();
    expect(ordersLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute('href', '/dashboard/user/profile');
    expect(ordersLink).toHaveAttribute('href', '/dashboard/user/orders');
  });

  test('integrates with useAuth and displays user info', () => {
    // Arrange
    const authState = {
      user: { name: 'Jane Doe', email: 'janedoe@foo.bar', address: 'NUS' },
      token: 'fake-nonce',
    };

    // Act
    renderDashboard(authState);

    // Assert
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('janedoe@foo.bar')).toBeInTheDocument();
    expect(screen.getByText('NUS')).toBeInTheDocument();
  });
  // Note: navigation is already tested in UserMenu.integration.test.js
  // Note: further E2E tests in tests/ui/pages/user/Dashboard.spec.js (covering both Dashboard and
  //   UserMenu)
});
