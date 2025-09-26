import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UpdateProduct from "./UpdateProduct";
import axios from "axios";
import toast from "react-hot-toast";

// Mock axios similar to other test files
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
}));

// Mock toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock router hooks
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: "test-slug" }),
}));

// Mock UI shell components
jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));
jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => null,
}));

// Helper render with router
const renderComponentWithRouter = (component) =>
  render(<MemoryRouter>{component}</MemoryRouter>);

describe("UpdateProduct", () => {
  let logSpy, errorSpy;

  // Suppress console.log and console.error during tests
  beforeAll(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful single product + categories responses
    // Self-note: must call .get in order
    axios.get.mockResolvedValueOnce({
      data: {
        product: {
          _id: "prodid1",
          name: "Shirt",
          description: "A very white shirt",
          price: 2.5,
          quantity: 10,
          shipping: "1",
          category: { _id: "cat1", name: "Cat A", slug: "cat-a" },
        },
      },
    });
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "cat1", name: "Cat A" }] },
    });
  });

  it("fetches single product and categories on mount", async () => {
    // Arrange + Act
    renderComponentWithRouter(<UpdateProduct />);

    // Assert
    expect(axios.get).toHaveBeenNthCalledWith(
      1,
      "/api/v1/product/get-product/test-slug"
    ); // React effects are top-down

    expect(axios.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/category/get-category"
    );

    await screen.findByDisplayValue("Shirt");
  });

  it("updates product successfully", async () => {
    // Arrange
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    renderComponentWithRouter(<UpdateProduct />);

    // Act
    await screen.findByDisplayValue("Shirt");

    fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
      target: { value: "Oversized Shirt" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
      target: { value: "A very oversized shirt" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
      target: { value: "25" },
    });
    fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
      target: { value: "5" },
    });

    fireEvent.click(screen.getByRole("button", { name: /update product/i }));

    // Assert
    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/product/update-product/prodid1",
        expect.any(FormData)
      )
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully")
    );
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products")
    );
  });

  it("shows error toast when update fails", async () => {
    // Arrange
    axios.put.mockRejectedValueOnce(new Error("fail"));
    renderComponentWithRouter(<UpdateProduct />);

    // Act
    await screen.findByDisplayValue("Shirt");
    fireEvent.click(screen.getByRole("button", { name: /update product/i }));

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/something went wrong/i)
      )
    );
  });

  it("sets shipping value to '0' when selecting No", async () => {
    // Arrange
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    renderComponentWithRouter(<UpdateProduct />);
    await screen.findByDisplayValue("Shirt");

    // Act
    const shippingSelect = screen.getByTestId("shipping-select");
    expect(shippingSelect).toHaveTextContent(/yes/i);

    const comboInput = within(shippingSelect).getByRole("combobox");
    fireEvent.focus(comboInput);
    fireEvent.keyDown(comboInput, { key: "ArrowDown" });

    const noOptionLabel = await screen.findByTestId("select-no-option-label");

    fireEvent.click(noOptionLabel);

    await waitFor(() => expect(shippingSelect).toHaveTextContent(/no/i));

    fireEvent.click(screen.getByRole("button", { name: /update product/i }));

    // Assert
    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/product/update-product/prodid1",
        expect.any(FormData)
      )
    );

    const formDataArg = axios.put.mock?.calls?.[0]?.[1];

    if (!(formDataArg instanceof FormData)) {
      throw new Error("Expected FormData as second argument");
    }

    const entries = Array.from(formDataArg.entries());
    const shippingEntry = entries.find(([k]) => k === "shipping");
    expect(shippingEntry).toBeDefined();
    expect(shippingEntry[1]).toBe("0");
  });

  it("deletes product successfully", async () => {
    // Arrange
    window.prompt = jest.fn(() => "yes");
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    renderComponentWithRouter(<UpdateProduct />);

    // Act
    await screen.findByDisplayValue("Shirt");

    fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

    // Assert
    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/product/delete-product/prodid1"
      )
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/deleted/i)
      )
    );
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products")
    );
  });

  it("shows error toast when delete fails", async () => {
    // Arrange
    window.prompt = jest.fn(() => "yes");
    axios.delete.mockRejectedValueOnce(new Error("boom"));
    renderComponentWithRouter(<UpdateProduct />);

    await screen.findByDisplayValue("Shirt");

    // Act
    fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/something went wrong/i)
      )
    );
  });
});
