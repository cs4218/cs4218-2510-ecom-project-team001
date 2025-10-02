import React from "react";
import { render, screen } from "@testing-library/react";
import Users from "./Users";


// chatgpt is used to aid in unit test creation
// Mock child components
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    <h2>{title}</h2>
    {children}
  </div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));

describe("Users Component", () => {
  it("should render Layout with correct title and heading", () => {
    render(<Users />);
    expect(screen.getByText("Dashboard - All Users")).toBeInTheDocument();
    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("should render AdminMenu inside the layout", () => {
    render(<Users />);
    expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
  });

  it("should display the heading 'All Users'", () => {
    render(<Users />);
    const heading = screen.getByRole("heading", { level: 1, name: "All Users" });
    expect(heading).toBeInTheDocument();
  });
});
