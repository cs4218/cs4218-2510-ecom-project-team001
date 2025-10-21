import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import app from '../../../server.js';
import categoryModel from '../../../models/categoryModel';
import Categories from '../pages/Categories';
import { CartProvider } from '../context/cart';
import { AuthProvider } from "../context/auth";
import { connectToTestDb, resetTestDb, disconnectFromTestDb } from '../../../tests/utils/db';

/**
 * =========== Integration Test for CategoriesPage ===========
 * This integration test covers categoryController and categoryModel integration
 * with the /categories page
 * 
 */

jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid='layout'>{children}</div>;
  };
});

describe('Categories Integration Tests', () => {
  let testCategory1, testCategory2;
  let server;

  beforeAll(async () => {
    await connectToTestDb('category-product-test');
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
    
    const PORT = 8081;
    server = app.listen(PORT);
    axios.defaults.baseURL = `http://localhost:${PORT}`;
    
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    testCategory1 = await categoryModel.create({
      name: 'Cat 1',
      slug: 'cat1'
    });

    testCategory2 = await categoryModel.create({
        name: 'Cat 2',
        slug: 'cat2'
    });
  });

  const renderCategories = (slug) => {
    return render(
      <MemoryRouter>
          <AuthProvider>
            <CartProvider>
              <Categories />
            </CartProvider>
          </AuthProvider>
        </MemoryRouter>
    );
  };

  test('should display all categories on /categories page', async () => {
    renderCategories();

    expect(await screen.findByText("Cat 1")).toBeInTheDocument();
    expect(await screen.findByText("Cat 2")).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Cat 1' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Cat 2' })).toBeInTheDocument();

    const cat1 = await screen.findByRole('link', { name: 'Cat 1' });
    expect(cat1).toHaveAttribute('href', '/category/cat1');

    const cat2 = await screen.findByRole('link', { name: 'Cat 2' });
    expect(cat2).toHaveAttribute('href', '/category/cat2');
  });

  test('should display no categories found message when there are no categories', async () => {
    await categoryModel.deleteMany({});
    renderCategories();

    expect(await screen.findByText("No categories found")).toBeInTheDocument();
  });
});