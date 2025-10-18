import React from 'react';
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import request from 'supertest';
import axios from 'axios';
import JWT from 'jsonwebtoken';
import HomePage from "../pages/HomePage";
import { CartProvider } from "../context/cart";
import app from '../../../server.js';
import userModel from '../../../models/userModel';
import categoryModel from '../../../models/categoryModel';
import productModel from '../../../models/productModel';
import { connectToTestDb, resetTestDb, disconnectFromTestDb } from '../../../tests/utils/db';

/**
 * =========== Integration Test for HomePage ===========
 * This integration test covers:
 * 1. Category Controller integration
 * 2. Product Controller integration
 * 3. Product Filters integration with backend
 * 4. Cart Context Provider integration
 * 5. Error handling with toasts
 * 
 * Tests and test data have been written in part with the help of AI
 */


jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

const renderHome = () =>
  render(
    <MemoryRouter>
      <CartProvider>
        <HomePage />
      </CartProvider>
    </MemoryRouter>
  );

describe('HomePage Real Integration Tests', () => {
  let server;
  let authToken;
  let testCategories = [];
  let testProducts = [];
  const tinyBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

  beforeAll(async () => {
    await connectToTestDb('homepage-integration-test');
  });

  afterAll(async () => {
    await disconnectFromTestDb();
  });

  afterEach(async () => {
    await new Promise(res => setTimeout(res, 50));
    await new Promise(resolve => server.close(resolve));
  });

  beforeEach(async () => {
    localStorage.clear();
    await resetTestDb();
    
    const PORT = 8084;
    server = app.listen(PORT);
    axios.defaults.baseURL = `http://localhost:${PORT}`;
    
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const adminUser = await userModel.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password',
      phone: '12345678',
      address: 'Test Address',
      answer: 'blue',
      role: 1,
    });

    authToken = JWT.sign(
      { _id: adminUser._id },
      process.env.JWT_SECRET || 'test-secret'
    );

    const booksCategory = await categoryModel.create({
      name: 'Books',
      slug: 'books',
    });
    const gadgetsCategory = await categoryModel.create({
      name: 'Gadgets',
      slug: 'gadgets',
    });
    const clothingCategory = await categoryModel.create({
      name: 'Clothing',
      slug: 'clothing',
    });

    testCategories = [booksCategory, gadgetsCategory, clothingCategory];

    await request(app)
      .post('/api/v1/product/create-product')
      .set('authorization', authToken)
      .field('name', 'Alpha')
      .field('description', 'desc A')
      .field('price', '5')
      .field('category', booksCategory._id.toString())
      .field('quantity', '10')
      .field('shipping', '1')
      .attach('photo', tinyBuffer, 'alpha.png');

    await request(app)
      .post('/api/v1/product/create-product')
      .set('authorization', authToken)
      .field('name', 'Beta')
      .field('description', 'desc B')
      .field('price', '15')
      .field('category', gadgetsCategory._id.toString())
      .field('quantity', '20')
      .field('shipping', '1')
      .attach('photo', tinyBuffer, 'beta.png');

    await request(app)
      .post('/api/v1/product/create-product')
      .set('authorization', authToken)
      .field('name', 'Gamma')
      .field('description', 'desc C')
      .field('price', '65')
      .field('category', clothingCategory._id.toString())
      .field('quantity', '15')
      .field('shipping', '1')
      .attach('photo', tinyBuffer, 'gamma.png');

    testProducts = await productModel.find({});

    jest.clearAllMocks();
  });

  test("should fetch categories from real database via get-category route", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Books' })).toBeInTheDocument();
    });

    expect(screen.getByRole('checkbox', { name: 'Gadgets' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Clothing' })).toBeInTheDocument();
  });

  test("should fetch and display products from real database via product-list route", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
    });

    expect(screen.getByRole("article", { name: "Product: Beta" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Product: Gamma" })).toBeInTheDocument();
  });

  test("should get correct product count from database via product-count route", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
    });

    const products = screen.getAllByRole("article");
    expect(products).toHaveLength(3);
  });

  test("should filter products by single category through real product-filters route", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("checkbox", { name: "Books" }));

    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("article", { name: "Product: Beta" })).not.toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Product: Gamma" })).not.toBeInTheDocument();
  });

  test("should filter products by multiple categories through real product-filters route", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("checkbox", { name: "Books" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Gadgets" }));

    // Should show Books and Gadgets products
    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
    });

    expect(screen.getByRole("article", { name: "Product: Beta" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Product: Gamma" })).not.toBeInTheDocument();
  });

  test("should filter products by price range through real product-filters route", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
    });

    // Apply $60 - $79.99 price filter
    fireEvent.click(screen.getByRole("radio", { name: "$60 - $79.99" }));

    // Should only show Gamma (price $65)
    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Gamma" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("article", { name: "Product: Alpha" })).not.toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Product: Beta" })).not.toBeInTheDocument();
  });

  test("should filter products by both category and price through real product-filters route", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Beta" })).toBeInTheDocument();
    });

    // Apply Gadgets category and $10 - $19.99 price filter
    fireEvent.click(screen.getByRole("checkbox", { name: "Gadgets" }));
    fireEvent.click(screen.getByRole("radio", { name: "$10 - $19.99" }));

    // Should only show Beta (Gadgets, price $15)
    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Beta" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("article", { name: "Product: Alpha" })).not.toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "Product: Gamma" })).not.toBeInTheDocument();
  });

  test("should add product to cart and persist to localStorage", async () => {
    renderHome();

    const alphaCard = await screen.findByRole("article", { name: "Product: Alpha" });

    fireEvent.click(within(alphaCard).getByRole("button", { name: "ADD TO CART" }));

    // Verify localStorage was updated
    const cartData = JSON.parse(localStorage.getItem('cart'));
    expect(cartData).toHaveLength(1);
    expect(cartData[0].name).toBe('Alpha');
    expect(cartData[0].price).toBe(5);
  });

  test("should reset filters when RESET FILTERS button is clicked", async () => {
    renderHome();

    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
    });

    // Apply filter
    fireEvent.click(screen.getByRole("checkbox", { name: "Books" }));

    await waitFor(() => {
      expect(screen.queryByRole("article", { name: "Product: Beta" })).not.toBeInTheDocument();
    });

    // Reset filters
    fireEvent.click(screen.getByRole("button", { name: "RESET FILTERS" }));

    // All products should be visible again
    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
    });

    expect(screen.getByRole("article", { name: "Product: Beta" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Product: Gamma" })).toBeInTheDocument();
  });

  test("should load more products when LOAD MORE button is clicked", async () => {
    // Create more products to enable load more functionality
    const extraProducts = [];
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/v1/product/create-product')
        .set('authorization', authToken)
        .field('name', `Extra Product ${i}`)
        .field('description', `desc ${i}`)
        .field('price', '25')
        .field('category', testCategories[0]._id.toString())
        .field('quantity', '5')
        .field('shipping', '1')
        .attach('photo', tinyBuffer, `extra${i}.png`);
    }

    renderHome();

    // Wait for initial products to load
    await waitFor(() => {
      expect(screen.getByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
    });

    const initialProducts = screen.getAllByRole("article");
    const initialCount = initialProducts.length;

    // Click load more if button exists
    const loadMoreButton = screen.queryByRole("button", { name: /Loadmore/i });
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
        const updatedProducts = screen.getAllByRole("article");
        expect(updatedProducts.length).toBeGreaterThan(initialCount);
    });
  });

  test("should navigate to product details when More Details is clicked", async () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

    renderHome();

    const alphaCard = await screen.findByRole("article", { name: "Product: Alpha" });
    const moreDetailsButton = within(alphaCard).getByRole("button", { name: "More Details" });

    fireEvent.click(moreDetailsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/product/alpha');
  });

  test("should handle server errors gracefully", async () => {
    await new Promise(resolve => server.close(resolve));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderHome();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    }, { timeout: 3000 });

    consoleSpy.mockRestore();
  });
});