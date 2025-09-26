import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Products from "./Products";
import axios from "axios";
import toast from "react-hot-toast";
import { SAMPLE_PRODUCTS } from "./testUtils/mockData";

// Mock dependencies
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => null,
}));

const renderComponentWithRouter = (component) =>
  render(<MemoryRouter>{component}</MemoryRouter>);

describe("Admin View Products", () => {
  // Set-up / Clean-up state
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { success: true, products: SAMPLE_PRODUCTS },
    });
  });

  // Technique: Equivalence Partitioning — validates the typical success scenario where API returns a set of products, ensuring rendering logic works for the partition of valid results.
  it("fetches products and renders a responsive card grid when API succeeds", async () => {
    // Arrange + Act
    renderComponentWithRouter(<Products />);

    // Assert
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product")
    );

    const renderedCards = await screen.findAllByTestId("product-card");
    expect(renderedCards).toHaveLength(SAMPLE_PRODUCTS.length);

    for (const product of SAMPLE_PRODUCTS) {
      expect(screen.getByText(product.name)).toBeInTheDocument();
      expect(screen.getByText(product.description)).toBeInTheDocument();
      const image = screen.getByAltText(product.name);
      expect(image).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${product._id}`
      );
    }
  });

  // Technique: Control Flow Testing — forces the error branch within getAllProducts to execute, asserting toast notification coverage when the HTTP request throws.
  it("shows a toast error when the product fetch fails", async () => {
    // Arrange
    const error = new Error("network unreachable");
    axios.get.mockRejectedValueOnce(error);

    // Act
    renderComponentWithRouter(<Products />);

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Someething Went Wrong")
    );
  });

  // Technique: Boundary Value Analysis — evaluates the lower boundary of zero products to ensure the grid gracefully renders without cards or stray links when the dataset is empty.
  it("renders an empty grid with no product links when API returns zero products", async () => {
    // Arrange - stubs return stub data
    axios.get.mockResolvedValueOnce({
      data: { success: true, products: [] },
    });

    // Act
    renderComponentWithRouter(<Products />);

    // Assert
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product")
    );

    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("maps each product card link to the correct update product page", async () => {
    // Arrange + Act
    renderComponentWithRouter(<Products />);

    // Assert
    const renderedLinks = await screen.findAllByRole("link");
    expect(renderedLinks).toHaveLength(SAMPLE_PRODUCTS.length);

    for (const product of SAMPLE_PRODUCTS) {
      const link = screen.getByRole("link", {
        name: new RegExp(product.name, "i"),
      });
      expect(link).toHaveAttribute(
        "href",
        `/dashboard/admin/product/${product.slug}`
      );
    }
  });
});
