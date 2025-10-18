import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import JWT from 'jsonwebtoken';

import app from '../../../../../server.js';
import userModel from '../../../../../models/userModel.js';
import categoryModel from '../../../../../models/categoryModel.js';
import productModel from '../../../../../models/productModel.js';
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from '../../../../../tests/utils/db.js';

import UpdateProduct from '../../../pages/admin/UpdateProduct';
import { products as testProducts } from '../../../../../tests/utils/testData/products.js';
import Products from '../../../pages/admin/Products.js';

jest.mock('../../../components/Layout', () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock('antd', () => {
  const Select = ({ children, onChange, className, value, ...rest }) => (
    <select
      className={className}
      onChange={(e) => onChange && onChange(e.target.value)}
      value={value}
      {...rest}
    >
      {children}
    </select>
  );
  Select.Option = ({ children, value, ...rest }) => (
    <option value={value} {...rest}>
      {children}
    </option>
  );
  return { Select };
});

describe('Products Page - Integration', () => {
  jest.setTimeout(2500);
  let server;
  let port;
  let authToken;
  let catA;
  let catB;

  beforeAll(async () => {
    await connectToTestDb('products-int-tests');
    // Quiet logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(async () => {
    console.error.mockRestore();
    console.log.mockRestore();
    await disconnectFromTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    server = app.listen(7457);
    port = server.address().port;
    axios.defaults.baseURL = `http://localhost:${port}`;

    const admin = await userModel.create({
      name: 'AdminUser',
      email: 'admin@int.test',
      password: 'password',
      phone: '88888888',
      address: 'NUS',
      answer: 'rainbow',
      role: 1,
    });
    authToken = JWT.sign(
      { _id: admin._id },
      process.env.JWT_SECRET || 'test-secret'
    );
    axios.defaults.headers.common['authorization'] = authToken;

    [catA, catB] = await categoryModel.insertMany([
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Books', slug: 'books' },
    ]);

    // Seed 10 products
    const docs = testProducts.map((p, idx) => ({
      ...p,
      category: idx < 5 ? catA._id : catB._id,
    }));
    await productModel.insertMany(docs);

    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = jest.fn(() => 'blob:mock');
    }
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));

    jest.clearAllMocks();
  });

  const renderWithRoutes = (initial) =>
    render(
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/dashboard/admin/products" element={<Products />} />
          <Route
            path="/dashboard/admin/product/:slug"
            element={<UpdateProduct />}
          />
        </Routes>
      </MemoryRouter>
    );

  describe('Integration with Server and Rendering', () => {
    test('lists products from API and shows Admin menu', async () => {
      // Act
      renderWithRoutes('/dashboard/admin/products');

      // Assert - Integration w AdminMenu
      expect(await screen.findByText('Admin Panel')).toBeInTheDocument();

      // Products listed
      // Exhaustively assert all product names and descriptions from test data
      await waitFor(() => {
        testProducts.forEach((p) => {
          expect(screen.getByText(p.name)).toBeInTheDocument();
          expect(screen.getByText(p.description)).toBeInTheDocument();
        });
      });

      // Check the length of products listed
      const cards = screen.getAllByTestId('product-card');
      expect(cards.length).toBe(10);
    });
  });

  describe('Integration with UpdateProduct navigation', () => {
    test('navigates to UpdateProduct and prefills fields for selected product', async () => {
      // Arrange
      renderWithRoutes('/dashboard/admin/products');
      await screen.findByText('Nebula Tablet');

      // Act - Click the card/link for "Nebula Tablet"
      const link = screen.getByRole('link', { name: /nebula tablet/i });
      fireEvent.click(link);

      // Assert - Update Product page loaded with prefilled values
      expect(await screen.findByText('Update Product')).toBeInTheDocument();

      const nameInput = await screen.findByPlaceholderText(/write a name/i);
      await waitFor(() => expect(nameInput).toHaveValue('Nebula Tablet'));
    });
  });
});
