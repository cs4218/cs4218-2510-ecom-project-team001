import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import JWT from 'jsonwebtoken';
import toast from 'react-hot-toast';

import app from '../../../../../server.js';
import userModel from '../../../../../models/userModel.js';
import categoryModel from '../../../../../models/categoryModel.js';
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from '../../../../../tests/utils/db.js';

import CreateProduct from '../../../pages/admin/CreateProduct';

jest.mock('../../../components/Layout', () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock('antd', () => {
  const Select = ({ children, onChange, className, placeholder }) => (
    <select
      className={className}
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {children}
    </select>
  );
  Select.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );
  return { Select };
});

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CreateProduct Page - Integration', () => {
  jest.setTimeout(25000);
  let server;
  let authToken;
  let port;

  // Set-up / Teardown state
  beforeAll(async () => {
    await connectToTestDb('create-product-int-tests');
    // Silence noisy logs
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

    // Test admin
    const admin = await userModel.create({
      name: 'BestestAdmin',
      email: 'bestadmin@test.com',
      password: 'password',
      phone: '12345678',
      address: 'NUS',
      answer: 'rainbow',
      role: 1,
    });
    authToken = JWT.sign(
      { _id: admin._id },
      process.env.JWT_SECRET || 'test-secret'
    );
    axios.defaults.headers.common['authorization'] = authToken;

    // Test categories
    await categoryModel.insertMany([
      { name: 'Stationery', slug: 'stationery' },
      { name: 'Snacks', slug: 'snacks' },
    ]);

    // URL.createObjectURL stub for image preview
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = jest.fn(() => 'blob:mock');
    }
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));

    jest.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/dashboard/admin/create-product']}>
        <CreateProduct />
      </MemoryRouter>
    );

  describe('Integration with Server and Rendering', () => {
    test('renders AdminMenu and category options from API', async () => {
      // Act
      renderPage();

      // Assert
      // AdminMenu present
      expect(await screen.findByText('Admin Panel')).toBeInTheDocument();

      // Category options fetched
      await screen.findByRole('option', { name: 'Stationery' });
      await screen.findByRole('option', { name: 'Snacks' });
    });

    test('successfully creates product and navigates', async () => {
      // Arrange
      renderPage();

      // Act
      fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
        target: { value: 'Blue Pen' },
      });
      fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
        target: { value: 'Ballpoint with AI builtin' },
      });
      fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
        target: { value: '2.50' },
      });
      fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
        target: { value: '25' },
      });

      await screen.findByRole('option', { name: 'Snacks' });
      const [catSelect, shipSelect] = screen.getAllByRole('combobox');
      fireEvent.change(catSelect, {
        target: {
          value: (
            await categoryModel.findOne({ name: 'Snacks' })
          )._id.toString(),
        },
      });
      fireEvent.change(shipSelect, { target: { value: '1' } });

      // Upload photo
      const file = new File([Buffer.from('tiny')], 'buldak-seaweed-yum.png', {
        type: 'image/png',
      });
      const fileInput = screen.getByLabelText(/upload photo/i);
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);

      fireEvent.click(screen.getByRole('button', { name: /create product/i }));

      // Assert (integration with server successful)
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'Product Created Successfully'
        )
      );
    });

    describe('400 validation errors for missing fields', () => {
      const baseFill = async () => {
        fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
          target: { value: 'Buldak Seaweed' },
        });
        fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
          target: { value: 'Very delicious seaweed' },
        });
        fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
          target: { value: '3.6' },
        });
        fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
          target: { value: '1000' },
        });
        await screen.findByRole('option', { name: 'Stationery' });
        const [catSelect, shipSelect] = screen.getAllByRole('combobox');
        fireEvent.change(catSelect, {
          target: {
            value: (
              await categoryModel.findOne({ name: 'Stationery' })
            )._id.toString(),
          },
        });
        fireEvent.change(shipSelect, { target: { value: '1' } });
        const file = new File([Buffer.from('abc')], 'a.png', {
          type: 'image/png',
        });
        const fileInput = screen.getByLabelText(/upload photo/i);
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          configurable: true,
        });
        fireEvent.change(fileInput);
      };

      // omit if field component allows so, else we have to manually setup
      const cases = [
        {
          missing: 'name',
          message: 'Name is Required',
          omit: () =>
            fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
              target: { value: '' },
            }),
        },
        {
          missing: 'description',
          message: 'Description is Required',
          omit: () =>
            fireEvent.change(
              screen.getByPlaceholderText(/write a description/i),
              { target: { value: '' } }
            ),
        },
        {
          missing: 'price',
          message: 'Price is Required',
          setup: async () => {
            // Fill everything except price
            fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
              target: { value: 'Buldak Seaweed' },
            });
            fireEvent.change(
              screen.getByPlaceholderText(/write a description/i),
              {
                target: { value: 'Delicious seaweed' },
              }
            );
            fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
              target: { value: '2000' },
            });
            await screen.findByRole('option', { name: 'Snacks' });
            const [catSelect, shipSelect] = screen.getAllByRole('combobox');
            fireEvent.change(catSelect, {
              target: {
                value: (
                  await categoryModel.findOne({ name: 'Snacks' })
                )._id.toString(),
              },
            });
            fireEvent.change(shipSelect, { target: { value: '1' } });
            const file = new File([Buffer.from('abc')], 'a.png', {
              type: 'image/png',
            });
            const fileInput = screen.getByLabelText(/upload photo/i);
            Object.defineProperty(fileInput, 'files', { value: [file] });
            fireEvent.change(fileInput);
          },
        },
        {
          missing: 'category',
          message: 'Category is Required',
          omit: () => {
            const [catSelect] = screen.getAllByRole('combobox');
            fireEvent.change(catSelect, { target: { value: '' } });
          },
        },
        {
          missing: 'quantity',
          message: 'Quantity is Required',
          setup: async () => {
            fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
              target: { value: 'Buldak Seaweed' },
            });
            fireEvent.change(
              screen.getByPlaceholderText(/write a description/i),
              {
                target: { value: 'Delicious seaweed' },
              }
            );
            fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
              target: { value: '10' },
            });
            await screen.findByRole('option', { name: 'Snacks' });
            const [catSelect, shipSelect] = screen.getAllByRole('combobox');
            fireEvent.change(catSelect, {
              target: {
                value: (
                  await categoryModel.findOne({ name: 'Stationery' })
                )._id.toString(),
              },
            });
            fireEvent.change(shipSelect, { target: { value: '1' } });
            const file = new File([Buffer.from('abc')], 'a.png', {
              type: 'image/png',
            });
            const fileInput = screen.getByLabelText(/upload photo/i);
            Object.defineProperty(fileInput, 'files', { value: [file] });
            fireEvent.change(fileInput);
          },
        },
        {
          missing: 'shipping',
          message: 'Shipping is Required',
          omit: () => {
            const [, shipSelect] = screen.getAllByRole('combobox');
            fireEvent.change(shipSelect, { target: { value: '' } });
          },
        },
        {
          missing: 'photo',
          message: 'Photo is Required and should be less than 1mb',
          setup: async () => {
            // Fill everything except photo input
            fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
              target: { value: 'Buldak Seaweed' },
            });
            fireEvent.change(
              screen.getByPlaceholderText(/write a description/i),
              {
                target: { value: 'Delicious seaweed' },
              }
            );
            fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
              target: { value: '10' },
            });
            fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
              target: { value: '2' },
            });
            await screen.findByRole('option', { name: 'Snacks' });
            const [catSelect, shipSelect] = screen.getAllByRole('combobox');
            fireEvent.change(catSelect, {
              target: {
                value: (
                  await categoryModel.findOne({ name: 'Snacks' })
                )._id.toString(),
              },
            });
            fireEvent.change(shipSelect, { target: { value: '1' } });
          },
        },
      ];

      test.each(cases)(
        'returns 400 and toast for missing $missing',
        async ({ setup, omit, message }) => {
          renderPage();

          if (setup) {
            await setup();
          } else {
            await baseFill();
          }

          if (omit) omit();

          fireEvent.click(
            screen.getByRole('button', { name: /create product/i })
          );

          await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(message)
          );
        }
      );
    });
  });
});
