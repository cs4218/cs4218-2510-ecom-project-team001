import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CartPage from "../pages/CartPage";
import { mock } from "node:test";

jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../styles/CartStyles.css", () => ({}));
jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("braintree-web-drop-in-react", () => {
  const React = require("react");
  const requestPaymentMethodMock = jest
    .fn()
    .mockResolvedValue({ nonce: "test-nonce" });

  const DropIn = ({ onInstance }) => {
    const calledRef = React.useRef(false);
    React.useEffect(() => {
      if (calledRef.current) return;
      calledRef.current = true;
      onInstance({ requestPaymentMethod: requestPaymentMethodMock });
    }, []);
    return <div data-testid="braintree-dropin">DropIn</div>;
  };

  return { __esModule: true, default: DropIn, requestPaymentMethodMock };
});

let mockCartValue = [];
const mockSetCart = jest.fn((next) => {
  mockCartValue = typeof next === "function" ? next(mockCartValue) : next;
});
let mockAuthValue = {};
const mockSetAuth = jest.fn();

const mockNavigate = jest.fn();

jest.mock("../context/auth", () => ({
  useAuth: () => [mockAuthValue, mockSetAuth],
}));
jest.mock("../context/cart", () => ({
  useCart: () => [mockCartValue, mockSetCart],
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Render cart page
const { act: domAct } = require("react-dom/test-utils");
const act = React.act || domAct;

const renderCartPage = async (cart = [], user = null) => {
  jest.clearAllMocks();

  // update mock state
  mockCartValue = cart;
  mockAuthValue = user ? { token: "test-token", user } : { token: null, user: null };

  // localStorage
  Storage.prototype.setItem = jest.fn();
  Storage.prototype.getItem = jest.fn(() => JSON.stringify(cart));
  Storage.prototype.removeItem = jest.fn();

  // token call resolves
  axios.get.mockResolvedValue({ data: { clientToken: "test-client-token" } });

  let utils;
  await act(async () => {
    utils = render(<CartPage />);
  });

  // flush the getToken effect (prevents act/env warnings & open handles)
  await waitFor(() =>
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token")
  );

  return utils;
};

describe("CartPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("integration with auth context -- user logged in", async () => {
    await renderCartPage([], null);

    expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
    expect(screen.getByText("Hello Guest")).toBeInTheDocument();
    expect(screen.getByText("Total: $0.00")).toBeInTheDocument();
  });

  test("integration with auth context - user logged in", async () => {
    const mockUser = {
      name: "Tester",
      email: "tester@gmail.com",
      address: "Tester Street",
      phone: "12345678",
    };

    await renderCartPage([], mockUser);

    expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
    expect(screen.getByText("Hello Tester")).toBeInTheDocument();
    expect(screen.getByText("Total: $0.00")).toBeInTheDocument();
  });

  test("integration with cart context", async () => {
    const mockProducts = [
      {
        _id: "1",
        name: "Product 1",
        price: 100,
        description: "Description 1 for product 1 that is kind of long and needs to be truncated. This description will be truncated to only the first 10 words.",
        quantity: 2,
      },
      { _id: "2", name: "Product 2", price: 200, description: "Description 2", quantity: 1 },
    ];
    const mockUser = {
      name: "Tester",
      email: "tester@gmail.com",
      address: "Tester Street",
      phone: "12345678",
    };

    await renderCartPage(mockProducts, mockUser);

    for (const p of mockProducts) {
      expect(screen.getByText(p.name)).toBeInTheDocument();
      expect(screen.getByText(p.description.split(" ").slice(0, 10).join(" "))).toBeInTheDocument();
      expect(screen.getByText(`Price: $${p.price}`)).toBeInTheDocument();
      expect(screen.getByText(`Quantity: ${p.quantity}`)).toBeInTheDocument();
      expect(screen.getByAltText(p.name)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(mockProducts.length);
  });

  test("integration with localStorage set item", async () => {
    const mockProducts = [{ _id: "1", name: "Product 1", price: 100, description: "Desc 1" }];
    await renderCartPage(mockProducts, { name: "X", address: "Y" });

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(mockSetCart).toHaveBeenCalledWith([]);
    expect(localStorage.setItem).toHaveBeenCalledWith("cart", "[]");
  });

  test("integration with braintree/token route", async () => {
    const authUser = { name: "A", address: "B" };
    await renderCartPage([{ _id: "1", name: "Product", price: 10, description: "Test" }], authUser);

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token")
    );
  });

  test("integration with braintree/payment route", async () => {
    const authUser = { name: "Foo", address: "123 Main St" };
    const cartItems = [{ _id: "1", name: "Product", price: 10, description: "Test" }];

    axios.post.mockResolvedValue({ data: { success: true } });

    await renderCartPage(cartItems, authUser);

    await screen.findByTestId("braintree-dropin");
    const payBtn = screen.getByRole("button", { name: "Make Payment" });
    expect(payBtn).toBeEnabled();

    fireEvent.click(payBtn);

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith("/api/v1/product/braintree/payment", {
        nonce: "test-nonce",
        cart: cartItems,
      })
    );
  });

  test("integration with localStorage removeItem", async () => {
    const authUser = { name: "Foo", address: "123 Main St" };
    const cartItems = [{ _id: "1", name: "Product", price: 10, description: "Test" }];

    axios.post.mockResolvedValue({ data: { success: true } });

    await renderCartPage(cartItems, authUser);

    await screen.findByTestId("braintree-dropin");
    const payBtn = screen.getByRole("button", { name: "Make Payment" });
    expect(payBtn).toBeEnabled();

    fireEvent.click(payBtn);
    await waitFor(() => axios.post);

    expect(localStorage.removeItem).toHaveBeenCalledWith("cart");
  });

  test("integration with localStorage removeItem - payment failure", async () => {
    const authUser = { name: "Foo", address: "123 Main St" };
    axios.post.mockRejectedValue(new Error("Payment failed"));

    const logSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await renderCartPage([{ _id: "1", name: "P", price: 10, description: "T" }], authUser);

    await screen.findByTestId("braintree-dropin");
    fireEvent.click(screen.getByRole("button", { name: "Make Payment" }));

    await waitFor(() => expect(logSpy).toHaveBeenCalled());

    // No clearing on failure
    expect(localStorage.removeItem).not.toHaveBeenCalledWith("cart");

    logSpy.mockRestore();
  });
});
