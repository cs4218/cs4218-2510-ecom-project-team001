import React from "react";
import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from "react-router-dom";
import AdminMenu from "./AdminMenu";

describe("AdminMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    const { getByText } = render(
        <MemoryRouter>
          <AdminMenu />
        </MemoryRouter>
    );
    expect(getByText("Admin Panel")).toBeInTheDocument();
    expect(getByText("Create Category")).toBeInTheDocument();
    expect(getByText("Create Product")).toBeInTheDocument();
    expect(getByText("Products")).toBeInTheDocument();
    expect(getByText("Orders")).toBeInTheDocument();
    // expect(getByText("Users")).toBeInTheDocument();
  });

  it("has correct href attributes for navigation links", () => {
    const { getByText } = render(
      <MemoryRouter>
        <AdminMenu />
      </MemoryRouter>
    );
    expect(getByText("Create Category").closest("a")).toHaveAttribute("href", "/dashboard/admin/create-category");
    expect(getByText("Create Product").closest("a")).toHaveAttribute("href", "/dashboard/admin/create-product");
    expect(getByText("Products").closest("a")).toHaveAttribute("href", "/dashboard/admin/products");
    expect(getByText("Orders").closest("a")).toHaveAttribute("href", "/dashboard/admin/orders");
  });
});
