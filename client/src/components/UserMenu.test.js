import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserMenu from "./UserMenu";

const renderWithRouter = (initialEntries = ["/dashboard/user/profile"]) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <UserMenu />
    </MemoryRouter>
  );

describe("UserMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Technique: Equivalence Partitioning — covers the main partition where the user on the dashboard
  // would be able to see both headings and links. This is an equivalence class because if one of
  // the NavLinks fail to render, then the other NavLink can be assumed to have failed to render.
  it("renders dashboard navigation links", () => {
    // Arrange & Act
    renderWithRouter();

    // Assert
    expect(
      screen.getByRole("heading", { level: 4, name: /dashboard/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute(
      "href",
      "/dashboard/user/profile"
    );
    expect(screen.getByRole("link", { name: /orders/i })).toHaveAttribute(
      "href",
      "/dashboard/user/orders"
    );
  });

  // Technique: Decision Table Testing — evaluates the rule where the current location equals the
  // /dashboard/user/profile route; The expected action is that the Profile nav item has the active
  // styling.
  // This validates the user requirement that the user can navigate between Profile and Orders on
  // the dashboard, with only one item being active at a time.
  it("marks profile link as active when on profile route", () => {
    // Arrange & Act
    renderWithRouter(["/dashboard/user/profile"]);

    // Assert
    const profileLink = screen.getByRole("link", { name: /profile/i });
    const ordersLink = screen.getByRole("link", { name: /orders/i });

    expect(profileLink.className).toMatch(/active/);
    expect(ordersLink.className).not.toMatch(/active/);
  });

  // Technique: Decision Table Testing — evaluates the rule where the current location equals the
  // /dashboard/user/orders route; The expected action is that the Orders nav item has the active
  // styling.
  it("marks orders link as active when on orders route", () => {
    // Arrange & Act
    renderWithRouter(["/dashboard/user/orders"]);

    // Assert
    const profileLink = screen.getByRole("link", { name: /profile/i });
    const ordersLink = screen.getByRole("link", { name: /orders/i });

    expect(ordersLink.className).toMatch(/active/);
    expect(profileLink.className).not.toMatch(/active/);
  });
});
