import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import JWT from 'jsonwebtoken';

import app from '../../../../../server.js';
import userModel from '../../../../../models/userModel.js';
import categoryModel from '../../../../../models/categoryModel.js';
import productModel from '../../../../../models/productModel.js';
import orderModel from '../../../../../models/orderModel.js';
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from '../../../../../tests/utils/db.js';

import AdminOrders from '../../../pages/admin/AdminOrders';
import { productsForOrders } from '../../../../../tests/utils/testData/products.js';

jest.mock('../../../context/auth', () => ({
  useAuth: () => [{ token: 'test-token' }, jest.fn()],
}));

jest.mock('../../../components/Layout', () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock('antd', () => {
  const Select = ({
    children,
    onChange,
    value,
    defaultValue,
    disabled,
    ...rest
  }) => (
    <select
      onChange={(e) => onChange && onChange(e.target.value)}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      data-testid="status-select"
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

describe('AdminOrders Page - Integration', () => {
  jest.setTimeout(2500);
  let server;
  let port;
  let admin;
  let buyer1;
  let buyer2;
  let cats;
  let prods;

  beforeAll(async () => {
    await connectToTestDb('admin-orders-int-tests');
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
    server = app.listen(7460);
    port = server.address().port;
    axios.defaults.baseURL = `http://localhost:${port}`;

    // Seed admin and two buyers
    [admin, buyer1, buyer2] = await userModel.insertMany([
      {
        name: 'AdminUser',
        email: 'admin@orders.int',
        password: 'password',
        phone: '88888888',
        address: 'NUS',
        answer: 'rainbow',
        role: 1,
      },
      {
        name: 'Cheng Hou',
        email: 'buyer1@orders.int',
        password: 'password',
        phone: '81117533',
        address: 'NUS',
        answer: 'rainbow',
        role: 0,
      },
      {
        name: 'Aaron',
        email: 'buyer2@orders.int',
        password: 'password',
        phone: '84242242',
        address: 'NUS',
        answer: 'rainbow',
        role: 0,
      },
    ]);

    const authToken = JWT.sign(
      { _id: admin._id },
      process.env.JWT_SECRET || 'test-secret'
    );
    axios.defaults.headers.common['authorization'] = authToken;

    // Seed categories
    cats = await categoryModel.insertMany([
      { name: 'Gadgets', slug: 'gadgets' },
      { name: 'Travel', slug: 'travel' },
    ]);

    // Seed 6 products for orders
    prods = await productModel.insertMany(
      productsForOrders.map((p, idx) => ({
        ...p,
        category: idx < 3 ? cats[0]._id : cats[1]._id,
      }))
    );

    // Create 2 orders, each with 3 products
    await orderModel.create([
      {
        products: [prods[0]._id, prods[1]._id, prods[2]._id, prods[3]._id],
        payment: { success: true, method: 'card' },
        buyer: buyer1._id,
        status: 'Not Process',
      },
      {
        products: [prods[0]._id, prods[3]._id, prods[4]._id, prods[5]._id],
        payment: { success: true, method: 'card' },
        buyer: buyer2._id,
        status: 'Processing',
      },
    ]);
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));

    jest.clearAllMocks();
  });

  const renderWithRoute = () =>
    render(
      <MemoryRouter initialEntries={['/dashboard/admin/orders']}>
        <Routes>
          <Route path="/dashboard/admin/orders" element={<AdminOrders />} />
        </Routes>
      </MemoryRouter>
    );

  test('renders all orders with product details and initial statuses', async () => {
    renderWithRoute();

    expect(await screen.findByText('Admin Panel')).toBeInTheDocument();

    // Assert - product names appear
    productsForOrders.forEach(async (p) => {
      await screen.findByText(p.name);
    });

    // Assert - orders are showing up: locate table cells that equal "4" exactly (to assert the qty)
    const quantityCells = await screen.findAllByRole('cell', {
      name: /^\s*4\s*$/,
    });
    expect(quantityCells.length).toBeGreaterThanOrEqual(2);

    // Status selects should have initial values
    const selects = await screen.findAllByTestId('status-select');

    // Assert there are 2 select drop-downs for 2 orders
    expect(selects.length).toBe(2);
  });

  test('updates order status via dropdown and reflects on server', async () => {
    renderWithRoute();

    // Arrange
    await screen.findByText('All Orders');

    const existing = await orderModel.find({}).sort({ createdAt: -1 });
    expect(existing.length).toBe(2);

    // Act - change the latest order's status to Delivered
    const selects = await screen.findAllByTestId('status-select');
    const firstSelect = selects[0];

    fireEvent.change(firstSelect, { target: { value: 'Delivered' } });

    // Assert - using persistence on server its the most accurate
    await waitFor(async () => {
      const updated = await orderModel.findById(existing[0]._id);
      expect(updated.status).toBe('Delivered');
    });
  });
});
