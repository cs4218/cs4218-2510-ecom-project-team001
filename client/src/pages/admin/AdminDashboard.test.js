import React from "react";
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useAuth } from '../../context/auth';
import AdminDashboard from "./AdminDashboard";

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Mocked AdminMenu</div>);
jest.mock("./../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);

const mockAuth = {
  user: {
    name: "Admin User",
    email: "admin@example.com",
    phone: "1234567890",
  },
};

describe("AdminDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders admin user information", () => {
    useAuth.mockReturnValue([mockAuth]);
    const { getByText, getByTestId } = render(
      <MemoryRouter initialEntries={["/dashboard/admin"]}>
        <Routes>
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByTestId('admin-menu')).toBeInTheDocument();
    expect(getByTestId('layout')).toBeInTheDocument();
    expect(getByText(/Admin Name\s*:\s*Admin User/i)).toBeInTheDocument();
    expect(getByText(/Admin Email\s*:\s*admin@example.com/i)).toBeInTheDocument();
    expect(getByText(/Admin Contact\s*:\s*1234567890/i)).toBeInTheDocument();
  });

  it("renders empty state when no admin data is available", () => {
    useAuth.mockReturnValue([null]);

    const { getByText, getByTestId } = render(
      <MemoryRouter initialEntries={["/dashboard/admin"]}>
        <Routes>
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByTestId('admin-menu')).toBeInTheDocument();
    expect(getByTestId('layout')).toBeInTheDocument();
    expect(getByText(/Admin Name\s*:/i)).toBeInTheDocument();
    expect(getByText(/Admin Email\s*:/i)).toBeInTheDocument();
    expect(getByText(/Admin Contact\s*:/i)).toBeInTheDocument();
  });
});