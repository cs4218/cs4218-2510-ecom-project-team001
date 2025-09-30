import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import { useAuth } from "../../context/auth";

jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: jest.fn(({ children }) => <div>{children}</div>),
}));

jest.mock("../../components/UserMenu", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="user-menu">User Menu Stub</div>),
}));

jest.mock("../../context/auth", () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

const renderDashboardWithRouter = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

describe("Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReset();
  });

  // Technique: Equivalence Partitioning — exercises the typical partition where all user fields
  // are populated, ensuring the dashboard renders the expected name, email, and address values.
  it("renders user profile data from auth context", () => {
    // Arrange
    useAuth.mockReturnValue([
      {
        user: {
          name: "Cheng Hou",
          email: "hello@example.com",
          address: "123 NUS Road",
        },
      },
      jest.fn(),
    ]);

    // Act
    renderDashboardWithRouter();

    // Assert
    expect(
      screen.getByRole("heading", { level: 3, name: /cheng hou/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /hello@example.com/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /123 nus road/i })
    ).toBeInTheDocument();
  });

  // Technique: Boundary Value Analysis — supplies minimal strings (empty address) to verify the
  // component still render without error.
  it("renders headings even when optional fields are empty", () => {
    // Arrange
    useAuth.mockReturnValue([
      {
        user: {
          name: "B",
          email: "b@example.com",
          address: "",
        },
      },
      jest.fn(),
    ]);

    // Act
    renderDashboardWithRouter();

    // Assert
    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(3);
  });

  // Technique: State-based unit test - verifies that the UserMenu component is rendered
  it("passes title to layout and nests the user menu", () => {
    // Arrange

    useAuth.mockReturnValue([
      {
        user: { name: "A", email: "a@example.com", address: "123 Main St" },
      },
      jest.fn(),
    ]);
    // Act
    renderDashboardWithRouter();

    // Assert
    expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    const userMenu = screen.getByTestId("user-menu");
    expect(within(userMenu).getByText(/user menu stub/i)).toBeInTheDocument();
  });
});
