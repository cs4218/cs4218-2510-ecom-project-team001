import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import request from 'supertest';
import axios from 'axios';
import JWT from 'jsonwebtoken';
import CartPage from "../pages/CartPage";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import app from '../../../server.js';
import userModel from '../../../models/userModel';
import categoryModel from '../../../models/categoryModel';
import productModel from '../../../models/productModel';
import { connectToTestDb, resetTestDb, disconnectFromTestDb } from '../../../tests/utils/db';

/**
 * =========== Integration Test for CartPage ===========
 * This integration test covers:
 * 1. Auth Context integration
 * 2. Cart Context integration
 * 3. Braintree token endpoint integration
 * 4. Braintree payment endpoint integration
 * 5. product data from database
 * 6. Complete payment flow
 * 
 * Tests and test data have been created in part with the help of AI
 */

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
    }, [onInstance]);
    return <div data-testid="braintree-dropin">DropIn Component</div>;
  };

  return { __esModule: true, default: DropIn, requestPaymentMethodMock };
});

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe('CartPage Real Integration Tests', () => {
  let server;
  let authToken;
  let testUser;
  let testCategory;
  let testProducts = [];
  const tinyBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

  beforeAll(async () => {
    await connectToTestDb('cartpage-integration-test');
  });

  afterAll(async () => {
    await disconnectFromTestDb();
  });

  afterEach(async () => {
    localStorage.clear();
    await new Promise(res => setTimeout(res, 50));
    await new Promise(resolve => server.close(resolve));
  });

  beforeEach(async () => {
    localStorage.clear();
    await resetTestDb();
    
    const PORT = 8088;
    server = app.listen(PORT);
    axios.defaults.baseURL = `http://localhost:${PORT}`;
    
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    testUser = await userModel.create({
      name: 'Test User',
      email: 'testuser@test.com',
      password: 'password123',
      phone: '87654321',
      address: '123 Test Street',
      answer: 'red',
      role: 0,
    });

    authToken = JWT.sign(
      { _id: testUser._id },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create test category
    testCategory = await categoryModel.create({
      name: 'Electronics',
      slug: 'electronics',
    });

    // Create test products through API
    await request(app)
      .post('/api/v1/product/create-product')
      .set('authorization', authToken)
      .field('name', 'Product 1')
      .field('description', 'Description 1')
      .field('price', '100')
      .field('category', testCategory._id.toString())
      .field('quantity', '2')
      .field('shipping', '1')
      .attach('photo', tinyBuffer, 'product1.png');

    await request(app)
      .post('/api/v1/product/create-product')
      .set('authorization', authToken)
      .field('name', 'Product 2')
      .field('description', 'Description 2')
      .field('price', '200')
      .field('category', testCategory._id.toString())
      .field('quantity', '1')
      .field('shipping', '1')
      .attach('photo', tinyBuffer, 'product2.png');

    testProducts = await productModel.find({});

    jest.clearAllMocks();
  });

  const renderCartPage = async (cartItems = [], authenticatedUser = null) => {
    // Setup localStorage with cart
    if (cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }

    // Setup auth in localStorage if user is authenticated
    if (authenticatedUser) {
      localStorage.setItem('auth', JSON.stringify({
        user: authenticatedUser,
        token: authToken
      }));
    }

    const { act: domAct } = require("react-dom/test-utils");
    const act = React.act || domAct;

    let utils;
    await act(async () => {
      utils = render(
        <MemoryRouter>
          <AuthProvider>
            <CartProvider>
              <CartPage />
            </CartProvider>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    return utils;
  };

  describe('Auth Context Integration', () => {
    test("should display guest message when user is not logged in", async () => {
      await renderCartPage([], null);

      expect(await screen.findByText("Hello Guest")).toBeInTheDocument();
      expect(await screen.findByText("Your Cart Is Empty")).toBeInTheDocument();
      expect(await screen.findByText("Total: $0.00")).toBeInTheDocument();
    });

    test("should display user details when user is logged in", async () => {
      await renderCartPage([], testUser);
      
      expect(await screen.findByText(`Hello ${testUser.name}`)).toBeInTheDocument();
      expect(await screen.findByText(`Hello ${testUser.address}`)).toBeInTheDocument();
      expect(await screen.findByText("Your Cart Is Empty")).toBeInTheDocument();
      expect(await screen.findByText("Total: $0.00")).toBeInTheDocument();
    });
  });

  describe('Cart Context and Product Integration', () => {
    test("should display products from cart from localStorage", async () => {
      const cartItems = [
        {
          _id: testProducts[0]._id.toString(),
          name: testProducts[0].name,
          price: testProducts[0].price,
          description: testProducts[0].description,
          quantity: testProducts[0].quantity,
        },
        {
          _id: testProducts[1]._id.toString(),
          name: testProducts[1].name,
          price: testProducts[1].price,
          description: testProducts[1].description,
          quantity: testProducts[1].quantity,
        },
      ];

      await renderCartPage(cartItems, testUser);

      expect(await screen.findByText("Product 1")).toBeInTheDocument();
      expect(await screen.findByText("Product 2")).toBeInTheDocument();
      expect(await screen.findByText("Price: $100")).toBeInTheDocument();
      expect(await screen.findByText("Price: $200")).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(2);
    });

    test("should remove product from cart and update localStorage", async () => {
      const cartItems = [
        {
          _id: testProducts[0]._id.toString(),
          name: testProducts[0].name,
          price: testProducts[0].price,
          description: testProducts[0].description,
        },
      ];

      await renderCartPage(cartItems, testUser);

      expect(await screen.findByText("Product 1")).toBeInTheDocument();

      const removeButton = screen.getByRole("button", { name: "Remove" });
      fireEvent.click(removeButton);

      expect(await screen.findByText("Your Cart Is Empty")).toBeInTheDocument();

      // Verify localStorage was updated
      const updatedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      expect(updatedCart).toHaveLength(0);
    });
  });

  describe('Braintree Token Integration', () => {
    test("should fetch braintree token from /braintree/token endpoint", async () => {
      const cartItems = [
        {
          _id: testProducts[0]._id.toString(),
          name: testProducts[0].name,
          price: testProducts[0].price,
          description: testProducts[0].description,
        },
      ];

      await renderCartPage(cartItems, testUser);

      // Braintree dropin should appear after token is fetched
      await waitFor(() => {
        expect(screen.getByTestId("braintree-dropin")).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test("should not show payment section for guest users", async () => {
      const cartItems = [
        {
          _id: testProducts[0]._id.toString(),
          name: testProducts[0].name,
          price: testProducts[0].price,
          description: testProducts[0].description,
        },
      ];

      await renderCartPage(cartItems, null);

      await waitFor(() => {
        expect(screen.getByText("Product 1")).toBeInTheDocument();
      });

      // Should show login prompt instead of payment section
      expect(screen.getByText(/Please Login to checkout/i)).toBeInTheDocument();
      expect(screen.queryByTestId("braintree-dropin")).not.toBeInTheDocument();
    });
  });

  describe('Braintree Payment Integration', () => {
    test("should process payment through braintree/payment endpoint", async () => {
      const cartItems = [
        {
          _id: testProducts[0]._id.toString(),
          name: testProducts[0].name,
          price: testProducts[0].price,
          description: testProducts[0].description,
        },
      ];

      await renderCartPage(cartItems, testUser);

      await waitFor(() => {
        expect(screen.getByTestId("braintree-dropin")).toBeInTheDocument();
      }, { timeout: 5000 });

      const paymentButton = screen.getByRole("button", { name: "Make Payment" });
      expect(paymentButton).toBeEnabled();

      fireEvent.click(paymentButton);

      await waitFor(() => {
        // Cart should be cleared after successful payment
        const cartData = localStorage.getItem('cart');
        expect(cartData).toBe(null);
      }, { timeout: 5000 });
    });

    test("should clear cart from localStorage after successful payment", async () => {
      const cartItems = [
        {
          _id: testProducts[0]._id.toString(),
          name: testProducts[0].name,
          price: testProducts[0].price,
          description: testProducts[0].description,
        },
        {
          _id: testProducts[1]._id.toString(),
          name: testProducts[1].name,
          price: testProducts[1].price,
          description: testProducts[1].description,
        },
      ];

      await renderCartPage(cartItems, testUser);

      await waitFor(() => {
        expect(screen.getByTestId("braintree-dropin")).toBeInTheDocument();
      }, { timeout: 5000 });

      let cartData = JSON.parse(localStorage.getItem('cart') || '[]');
      expect(cartData).toHaveLength(2);

      const paymentButton = screen.getByRole("button", { name: "Make Payment" });
      fireEvent.click(paymentButton);

      await waitFor(() => {
        const updatedCart = localStorage.getItem('cart');
        expect(updatedCart).toBe(null);
      }, { timeout: 5000 });
    });

    test("should navigate to dashboard after successful payment", async () => {
      const cartItems = [
        {
          _id: testProducts[0]._id.toString(),
          name: testProducts[0].name,
          price: testProducts[0].price,
          description: testProducts[0].description,
        },
      ];

      await renderCartPage(cartItems, testUser);

      await waitFor(() => {
        expect(screen.getByTestId("braintree-dropin")).toBeInTheDocument();
      }, { timeout: 5000 });

      const paymentButton = screen.getByRole("button", { name: "Make Payment" });
      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
      }, { timeout: 5000 });
    });

    test("should handle payment failure gracefully", async () => {
      const { requestPaymentMethodMock } = require("braintree-web-drop-in-react");
      requestPaymentMethodMock.mockRejectedValueOnce(new Error("Payment method failed"));

      const cartItems = [
        {
          _id: testProducts[0]._id.toString(),
          name: testProducts[0].name,
          price: testProducts[0].price,
          description: testProducts[0].description,
        },
      ];

      await renderCartPage(cartItems, testUser);

      await waitFor(() => {
        expect(screen.getByTestId("braintree-dropin")).toBeInTheDocument();
      }, { timeout: 5000 });

      const paymentButton = screen.getByRole("button", { name: "Make Payment" });
      fireEvent.click(paymentButton);

      // Cart should NOT be cleared on failure
      await waitFor(() => {
        const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
        expect(cartData.length).toBeGreaterThan(0);
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      requestPaymentMethodMock.mockResolvedValue({ nonce: "test-nonce-123" });
    });
  });

  describe('End-to-End Cart Flow', () => {
    test("should complete full flow: add to cart, view cart, make payment", async () => {
      const cartItems = [
        {
          _id: testProducts[0]._id.toString(),
          name: testProducts[0].name,
          price: testProducts[0].price,
          description: testProducts[0].description,
        },
        {
          _id: testProducts[1]._id.toString(),
          name: testProducts[1].name,
          price: testProducts[1].price,
          description: testProducts[1].description,
        },
      ];

      await renderCartPage(cartItems, testUser);

      expect(await screen.findByText("Product 1")).toBeInTheDocument();
      expect(await screen.findByText("Product 2")).toBeInTheDocument();
      expect(await screen.findByText("Total: $300.00")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId("braintree-dropin")).toBeInTheDocument();
      }, { timeout: 5000 });

      const paymentButton = screen.getByRole("button", { name: "Make Payment" });
      fireEvent.click(paymentButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
      }, { timeout: 5000 });
      expect(localStorage.getItem('cart')).toBe(null);
    });
  });
});