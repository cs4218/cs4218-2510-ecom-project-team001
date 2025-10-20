import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import app from '../../../server.js';
import categoryModel from '../../../models/categoryModel';
import productModel from '../../../models/productModel';
import CategoryProduct from '../pages/CategoryProduct';
import { CartProvider } from '../context/cart';
import { connectToTestDb, resetTestDb, disconnectFromTestDb } from '../../../tests/utils/db';

/* 
  This integration test tests:
  1. Category Products API Integration between CategoryProduct and productCategoryController
  2. Error handling with 404 page

  Referred code from unit tests and used AI to generate sample data
*/ 

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid='layout'>{children}</div>;
  };
});

describe('CategoryProduct Integration Tests', () => {
  let testCategory;
  let testProduct1;
  let testProduct2;
  let server;
  const tinyBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

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
    mockNavigate.mockClear();
    await resetTestDb();
    
    const PORT = 8084;
    server = app.listen(PORT);
    axios.defaults.baseURL = `http://localhost:${PORT}`;
    
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    testCategory = await categoryModel.create({
      name: 'Electronics',
      slug: 'electronics'
    });

    testProduct1 = await productModel.create({
      name: 'Laptop',
      slug: 'laptop',
      description: 'A high-performance laptop for developers',
      price: 999.99,
      category: testCategory._id,
      quantity: 10,
      photo: {
        data: tinyBuffer,
        contentType: 'image/gif'
      }
    });

    testProduct2 = await productModel.create({
      name: 'Smartphone',
      slug: 'smartphone',
      description: 'Latest flagship smartphone with amazing features and long battery life',
      price: 799.99,
      category: testCategory._id,
      quantity: 15,
      photo: {
        data: tinyBuffer,
        contentType: 'image/gif'
      }
    });
  });

  const renderCategoryProduct = (slug) => {
    return render(
      <MemoryRouter initialEntries={[`/category/${slug}`]}>
        <CartProvider>
          <Routes>
            <Route path='/category/:slug' element={<CategoryProduct />} />
          </Routes>
        </CartProvider>
      </MemoryRouter>
    );
  };

  test('should display category with products, correct formatting, and handle navigation', async () => {
    renderCategoryProduct('electronics');

    await waitFor(() => {
      expect(screen.getByText('Category - Electronics')).toBeInTheDocument();
    });

    expect(screen.getByText('2 result found')).toBeInTheDocument();
    
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('Smartphone')).toBeInTheDocument();
    expect(screen.getByText('$999.99')).toBeInTheDocument();
    expect(screen.getByText('$799.99')).toBeInTheDocument();
    expect(screen.getByText('A high-performance laptop for developers')).toBeInTheDocument();
    
    expect(screen.getByText('Latest flagship smartphone with amazing features and long ba...')).toBeInTheDocument();
    
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', `/api/v1/product/product-photo/${testProduct1._id}`);
    expect(images[0]).toHaveAttribute('alt', 'Laptop');
    
    const moreDetailsButtons = screen.getAllByText('More Details');
    expect(moreDetailsButtons).toHaveLength(2);
    fireEvent.click(moreDetailsButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/product/laptop');
  });

  test('should navigate to 404 for non-existent category', async () => {
    renderCategoryProduct('non-existent category');
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/404');
    });
  });

  test('should display empty results for category with no products', async () => {
    await categoryModel.create({
      name: 'Empty Category',
      slug: 'empty-category'
    });

    renderCategoryProduct('empty-category');

    await waitFor(() => {
      expect(screen.getByText('Category - Empty Category')).toBeInTheDocument();
    });

    expect(screen.getByText('0 result found')).toBeInTheDocument();
    expect(screen.queryByText('Laptop')).not.toBeInTheDocument();
  });
});