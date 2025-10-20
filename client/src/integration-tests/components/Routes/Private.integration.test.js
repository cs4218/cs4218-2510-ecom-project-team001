import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import JWT from 'jsonwebtoken';

import app from '../../../../../server.js';
import userModel from '../../../../../models/userModel.js';
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from '../../../../../tests/utils/db.js';

import { AuthProvider } from '../../../context/auth';
import PrivateRoute from '../../../components/Routes/Private';

jest.mock('../../../components/Spinner', () => ({
  __esModule: true,
  default: ({ path }) => (
    <div data-testid="spinner" data-path={path}>
      Loading...
    </div>
  ),
}));

describe('PrivateRoute - Integration', () => {
  jest.setTimeout(25000);
  let server;
  let port;

  // Set-up / Clean-up state
  beforeAll(async () => {
    await connectToTestDb('private-route-int');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(async () => {
    console.error.mockRestore();
    console.log.mockRestore();
    await disconnectFromTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    // Start API server
    server = app.listen(7771);
    port = server.address().port;
    axios.defaults.baseURL = `http://localhost:${port}`;
    // prevent interference from other tests because we might have set auth hdr
    delete axios.defaults.headers.common['authorization'];
    localStorage.clear();
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    jest.clearAllMocks();
  });

  const renderWithRouter = (initialEntry = '/private') =>
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/private" element={<PrivateRoute />}>
              <Route
                index
                element={<div data-testid="private-ok">Private OK</div>}
              />
            </Route>
            <Route
              path="/login"
              element={<div data-testid="login-page">Login</div>}
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

  test('shows Spinner redirect when unauthenticated', async () => {
    // Act with no auth
    renderWithRouter();

    // Assert - Spinner is shown while redirecting
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toHaveAttribute(
      'data-path',
      'login'
    );
  });

  test('renders Outlet content when auntheticated', async () => {
    // Arrange
    const user = await userModel.create({
      name: 'Janice',
      email: 'janice@test.com',
      password: 'password',
      phone: '12345678',
      address: 'NUS',
      answer: 'blue',
      role: 0,
    });

    const token = JWT.sign(
      { _id: user._id },
      process.env.JWT_SECRET || 'test-secret'
    );
    axios.defaults.headers.common['authorization'] = token;
    localStorage.setItem(
      'auth',
      JSON.stringify({
        user: { name: user.name, email: user.email, role: 0 },
        token,
      })
    );

    // Act
    renderWithRouter();

    // Assert - Private OK is shown
    expect(await screen.findByTestId('private-ok')).toBeInTheDocument();
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });
});
