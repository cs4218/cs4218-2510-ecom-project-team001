import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminOrders from "./AdminOrders";
import axios from "axios";
import toast from "react-hot-toast";
import { SAMPLE_ORDERS } from "./testUtils/mockData";

// Mock collaborators
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
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

const mockUseAuth = jest.fn();
jest.mock("../../context/auth", () => ({
  useAuth: (...args) => mockUseAuth(...args),
}));

jest.mock("moment", () => () => ({ fromNow: () => "8 months ago" }));

jest.mock("antd", () => {
  const Select = ({
    value,
    defaultValue,
    onChange = () => {},
    disabled,
    children,
    ...rest
  }) => (
    <select
      {...rest}
      value={value ?? defaultValue}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {children}
    </select>
  );

  const Option = ({ value, children, ...rest }) => (
    <option {...rest} value={value}>
      {children}
    </option>
  );

  Select.Option = Option;

  return { Select, Option };
});

const renderComponentWithRouter = (component) =>
  render(<MemoryRouter>{component}</MemoryRouter>);

describe("AdminOrders", () => {
  // Set-up / Clean-up state
  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: SAMPLE_ORDERS });
    axios.put.mockResolvedValue({ data: { success: true } });
    mockUseAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
  });

  it("fetches and displays orders when auth token available", async () => {
    // Arrange + Act
    renderComponentWithRouter(<AdminOrders />);

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders")
    );

    // Assert
    expect(await screen.findByText("chenghou")).toBeInTheDocument();
    expect(screen.getByText(/blue shirt/i)).toBeInTheDocument();
    expect(screen.getByText(/price : 29.99/i)).toBeInTheDocument();
  });

  it("does not fetch orders when auth token missing", async () => {
    // Arrange
    mockUseAuth.mockReturnValueOnce([{}, jest.fn()]);

    // Act
    renderComponentWithRouter(<AdminOrders />);

    // Assert
    await waitFor(() => expect(axios.get).not.toHaveBeenCalled());
  });

  it("updates order status and refetches orders", async () => {
    // Arrange
    renderComponentWithRouter(<AdminOrders />);

    // Act
    const statusSelect = await screen.findByDisplayValue("Processing");

    fireEvent.change(statusSelect, { target: { value: "Shipped" } });

    // Assert
    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/order-status/order1",
        { status: "Shipped" }
      )
    );
    // once on mount, once after status change
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  });

  it("logs error in the console when update fails", async () => {
    // Arrange
    axios.put.mockRejectedValueOnce(new Error("internal server error"));

    renderComponentWithRouter(<AdminOrders />);

    // Act
    const statusSelect = await screen.findByDisplayValue("Processing");
    fireEvent.change(statusSelect, { target: { value: "Shipped" } });

    // Assert
    await waitFor(() => expect(console.error).toHaveBeenCalled());
  });

  it("shows success toast after updating status", async () => {
    // Arrange
    renderComponentWithRouter(<AdminOrders />);

    // Act
    const statusSelect = await screen.findByDisplayValue("Processing");
    fireEvent.change(statusSelect, { target: { value: "Delivered" } });

    // Assert
    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/order-status/order1",
        { status: "Delivered" }
      )
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Status Updated Successfully")
    );
  });

  it("disallows status select while submission is in progress, prevents race conditions", async () => {
    // Arrange
    // Store resolve function to control when the PUT request resolves
    let resolvePut;
    const pendingPut = new Promise((resolve) => {
      resolvePut = resolve;
    });
    axios.put.mockReturnValueOnce(pendingPut);

    renderComponentWithRouter(<AdminOrders />);

    // Act
    const statusSelect = await screen.findByDisplayValue("Processing");
    fireEvent.change(statusSelect, { target: { value: "Shipped" } });

    // Assert
    await waitFor(() => expect(statusSelect).toBeDisabled());

    resolvePut({ data: { success: true } });

    await waitFor(() => expect(statusSelect).not.toBeDisabled());
  });

  it("renders failed payment status when payment is unsuccessful", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: SAMPLE_ORDERS.map((order) => ({
        ...order,
        payment: { ...order.payment, success: false },
      })),
    });

    // Act
    renderComponentWithRouter(<AdminOrders />);

    // Assert
    expect(await screen.findAllByText(/failed/i)).toHaveLength(2);
    expect(screen.queryByText(/success/i)).not.toBeInTheDocument();
  });
});
