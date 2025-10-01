import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Orders from "./Orders";
import axios from "axios";
import { useAuth } from "../../context/auth";

// test cases below created with aid from chatGPT
// mock dependencies
jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../../components/UserMenu", () => () => <div>UserMenu</div>);
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

describe("Orders Component", () => {
  const mockOrders = [
    {
      _id: "order1",
      status: "Processing",
      buyer: { name: "John Doe" },
      createAt: new Date().toISOString(),
      payment: { success: true },
      products: [
        {
          _id: "prod1",
          name: "Product A",
          description: "This is product A description",
          price: 100,
        },
        {
          _id: "prod2",
          name: "Product B",
          description: "This is product B description",
          price: 200,
        },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //
  // 🔹 Initial Conditions & State Transitions
  //
  describe("Initial Conditions & State Transitions", () => {
    it("should render with initial empty state", () => {
      useAuth.mockReturnValue([{ token: null }, jest.fn()]);
      render(<Orders />);
      expect(screen.getByText(/All Orders/i)).toBeInTheDocument();
      expect(screen.getByText(/UserMenu/i)).toBeInTheDocument();
    });

    it("should fetch orders only when auth token exists", async () => {
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      render(<Orders />);

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders")
      );
    });
  });

  //
  // 🔹 Rendered Output & Data Presentation
  //
  describe("Rendered Output & Data Presentation", () => {
    it("should display order details in the table when orders are loaded", async () => {
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      render(<Orders />);

      // check the order details are loaded and correct
      expect(await screen.findByText("Processing")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText(/Success/i)).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // quantity

      // check the product details are loaded and correct
      expect(await screen.findByText("Product A")).toBeInTheDocument();
      expect(screen.getByText(/Price : 100/)).toBeInTheDocument();
      expect(screen.getByText("Product B")).toBeInTheDocument();
      expect(screen.getByText(/Price : 200/)).toBeInTheDocument();
    });

    it("should display 'Failed' when payment is unsuccessful", async () => {
      const failedOrder = [
        {
          _id: "order2",
          status: "Shipped",
          buyer: { name: "Jane Smith" },
          createAt: new Date().toISOString(),
          payment: { success: false },
          products: [
            {
              _id: "prod3",
              name: "Product C",
              description: "This is product C description",
              price: 150,
            },
          ],
        },
      ];

      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: failedOrder });

      render(<Orders />);

      expect(await screen.findByText("Failed")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Product C")).toBeInTheDocument();
      expect(screen.getByText(/Price : 150/)).toBeInTheDocument();
    });
  });

  //
  // 🔹 Integration & Interaction Checks
  //
  describe("Integration & Interaction Checks", () => {
    it("should use Layout and UserMenu components in rendering", () => {
      useAuth.mockReturnValue([{ token: null }, jest.fn()]);
      render(<Orders />);
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByText("UserMenu")).toBeInTheDocument();
    });

    it("should call axios.get with correct endpoint when fetching orders", async () => {
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockResolvedValue({ data: mockOrders });

      render(<Orders />);

      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders")
      );
    });
  });

  //
  // 🔹 Failure & Exception Handling
  //
  describe("Failure & Exception Handling", () => {
    it("should log error when API call fails", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      useAuth.mockReturnValue([{ token: "valid-token" }, jest.fn()]);
      axios.get.mockRejectedValue(new Error("Network Error"));

      render(<Orders />);

      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());

      consoleSpy.mockRestore();
    });

    it("should not call API when auth token is missing", async () => {
      useAuth.mockReturnValue([{ token: null }, jest.fn()]);
      render(<Orders />);
      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalled();
      });
    });
  });
});
