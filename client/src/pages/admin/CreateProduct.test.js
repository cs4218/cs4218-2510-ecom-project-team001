import React from "react";
import { screen, fireEvent, waitFor, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreateProduct from "./CreateProduct";
import axios from "axios";
import toast from "react-hot-toast";

// Mock direct dependencies
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock UI components that are not under test
jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));
jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => null,
}));

// Mock auth context if used by the component
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

// Helper to render with router context
const renderComponentWithRouter = (component) =>
  render(<MemoryRouter>{component}</MemoryRouter>);

describe("CreateProduct", () => {
  // Set-up / Clean-up state
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: { success: true, category: [{ _id: "1", name: "Cat A" }] },
    });
  });

  // Suppress console.log and console.error during tests
  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => {
    console.error.mockRestore();
    console.log.mockRestore();
  });

  it("fetches categories on render", async () => {
    // Act
    renderComponentWithRouter(<CreateProduct />);

    // Assert
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");

    await waitFor(() => expect(toast.error).not.toHaveBeenCalled());
  });

  it("shows error toast if fetching categories fails", async () => {
    // Arrange
    axios.get.mockRejectedValueOnce(new Error("boom"));

    // Act
    renderComponentWithRouter(<CreateProduct />);

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/something went wrong/i)
      )
    );
  });

  it("submits product and sends FormData payload", async () => {
    // Arrange
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "ok" },
    });

    renderComponentWithRouter(<CreateProduct />);

    // Act
    fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
      target: { value: "Pen" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
      target: { value: "Blue ink" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a Price/i), {
      target: { value: "2.50" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
      target: { value: "10" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create product/i }));

    // Assert
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/create-product",
        expect.any(FormData)
      )
    );
  });

  it("on failure response it should not navigate and should show error", async () => {
    // Arrange
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "fail" },
    });
    renderComponentWithRouter(<CreateProduct />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: /create product/i }));

    // Assert
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("on success response should show success and navigate", async () => {
    // Arrange
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "ok" },
    });
    renderComponentWithRouter(<CreateProduct />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: /create product/i }));

    // Assert
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products")
    );
  });

  it("shows error toast if create product throws", async () => {
    // Arrange
    axios.post.mockRejectedValueOnce(new Error("boom"));
    renderComponentWithRouter(<CreateProduct />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: /create product/i }));

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/something went wrong/i)
      )
    );
  });

  it("shows error toast that name is required if name is not filled", async () => {
    // Arrange
    axios.post.mockResolvedValueOnce({
      data: { error: "Name is Required" },
    });
    renderComponentWithRouter(<CreateProduct />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: /create product/i }));

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("Name is Required")
      )
    );
  });

  it("does not allow negative values for price", async () => {
    // Arrange
    render(<CreateProduct />);

    const priceInput = screen.getByPlaceholderText(/write a price/i);

    // Act
    fireEvent.change(priceInput, { target: { value: "-5" } });

    // Assert
    await waitFor(() => expect(priceInput.value).toBe("0"));

    expect(priceInput).toHaveAttribute("min", "0");
    // A reasonable upper bound for price
    expect(priceInput).toHaveAttribute("max", "1000000");
  });

  it("does not allow negative values for quantity", async () => {
    // Arrange
    render(<CreateProduct />);

    const qtyInput = screen.getByPlaceholderText(/write a quantity/i);

    // Act
    fireEvent.change(qtyInput, { target: { value: "-10" } });

    // Assert
    await waitFor(() => expect(qtyInput.value).toBe("0"));

    expect(qtyInput).toHaveAttribute("min", "0");
    // A reasonable upper bound for quantity
    expect(qtyInput).toHaveAttribute("max", "1000000");
  });
});
