import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import request from 'supertest';
import axios from 'axios';
import JWT from 'jsonwebtoken';
import app from '../../../server.js'; 
import userModel from '../../../models/userModel';
import categoryModel from '../../../models/categoryModel';
import productModel from '../../../models/productModel';
import ProductDetails from '../pages/ProductDetails';
import { CartProvider } from '../context/cart';
import { connectToTestDb, resetTestDb, disconnectFromTestDb } from '../../../tests/utils/db';

/* 
  This integration test tests:
  1. Shopping Cart Integration between ProductDetails and Cart context
  2. Product Data Integration between ProductDetails and getProductController (+ productPhotoController)
  3. Related Products API Integration between ProductDetails and realtedProductController
  4. Error handling with 404 page

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

describe('ProductDetails Integration Tests', () => {
  let authToken;
  let testCategory;
  let testProduct;
  let relatedProduct1;
  let relatedProduct2;
  let server;
  const tinyBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  
  beforeAll(async () => {
    await connectToTestDb('product-details-test');
    
  });

  afterAll(async () => {
    await disconnectFromTestDb();
    
  });

  afterEach(async () => {
  await new Promise(res => setTimeout(res, 50)); // small delay to let axios finish
  await new Promise(resolve => server.close(resolve));
});

  beforeEach(async () => {
    localStorage.clear();
    await resetTestDb();
    const PORT = 8083; // Or any available port
    server = app.listen(PORT);
    axios.defaults.baseURL = `http://localhost:${PORT}`;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const adminUser = await userModel.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password',
      phone: '12345678',
      address: 'National University of Singapore',
      answer: 'blue',
      role: 1,
    });

    authToken = JWT.sign(
      { _id: adminUser._id },
      process.env.JWT_SECRET || 'test-secret'
    );

    testCategory = await categoryModel.create({
      name: 'Electronics',
      slug: 'electronics',
    });

    // Create main test product
    const res1 = await request(app)
      .post('/api/v1/product/create-product')
      .set('authorization', authToken)
      .field('name', 'Test Laptop')
      .field('description', 'A high-performance laptop for testing')
      .field('price', '999')
      .field('category', testCategory._id.toString())
      .field('quantity', '10')
      .field('shipping', '1')
      .attach('photo', tinyBuffer, 'laptop.png');
    
    testProduct = await productModel.findOne({ name: 'Test Laptop' });

    // Create related products
    const res2 = await request(app)
      .post('/api/v1/product/create-product')
      .set('authorization', authToken)
      .field('name', 'Related Mouse')
      .field('description', 'A wireless mouse that works great with the laptop and has many features')
      .field('price', '49')
      .field('category', testCategory._id.toString())
      .field('quantity', '50')
      .field('shipping', '1')
      .attach('photo', tinyBuffer, 'mouse.png');
    
    relatedProduct1 = await productModel.findOne({ name: 'Related Mouse' });

    const res3 = await request(app)
      .post('/api/v1/product/create-product')
      .set('authorization', authToken)
      .field('name', 'Related Keyboard')
      .field('description', 'A mechanical keyboard for programming')
      .field('price', '89')
      .field('category', testCategory._id.toString())
      .field('quantity', '30')
      .field('shipping', '1')
      .attach('photo', tinyBuffer, 'keyboard.png');
    
    relatedProduct2 = await productModel.findOne({ name: 'Related Keyboard' });

    jest.clearAllMocks();
  });

  const renderComponent = (slug) => {
    return render(
      <MemoryRouter initialEntries={[`/product/${slug}`]}>
        <Routes>
          <Route path='/product/:slug' element={
            <CartProvider>
              <ProductDetails />
            </CartProvider>
          } />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Product Data and Related Products Retrieval from MongoDB', () => {
    test('should fetch and display product details, related products and photo from database', async () => {
      renderComponent(testProduct.slug);
      

      await waitFor(() => {
        expect(screen.getByText('Name : Test Laptop')).toBeInTheDocument();
      });

      expect(screen.getByText('Description : A high-performance laptop for testing')).toBeInTheDocument();
      expect(screen.getByText(/\$999\.00/)).toBeInTheDocument();
      expect(screen.getByText('Category : Electronics')).toBeInTheDocument();

      const img = await screen.findByAltText('Test Laptop');

      expect(img).toBeInTheDocument();
      expect(img.src).toContain(`/api/v1/product/product-photo/${testProduct._id}`);

      expect(await screen.findByText('Related Mouse')).toBeInTheDocument();
      expect(await screen.findByText('Related Keyboard')).toBeInTheDocument();

      expect(screen.getByText(/\$49\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$89\.00/)).toBeInTheDocument();
    });

    test('should navigate to related product when clicking More Details', async () => {
      renderComponent(testProduct.slug);

      expect(await screen.findByText('Related Mouse')).toBeInTheDocument();

      const moreDetailsMouseButtons = screen.getAllByText('More Details')[0];
      fireEvent.click(moreDetailsMouseButtons);

      expect(mockNavigate).toHaveBeenCalledWith(`/product/${relatedProduct1.slug}`);

      expect(await screen.findByText('Related Keyboard')).toBeInTheDocument();

      const moreDetailsKeyboardButtons = screen.getAllByText('More Details')[1];
      fireEvent.click(moreDetailsKeyboardButtons);

      expect(mockNavigate).toHaveBeenCalledWith(`/product/${relatedProduct2.slug}`);
    });

    test('should navigate to 404 for non-existent product', async () => {
      renderComponent('non-existent product');
    
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/404');
      });
    });
  });

  describe('Shopping Cart Integration', () => {
    test('should add product to cart from database', async () => {
      renderComponent(testProduct.slug);

      await waitFor(() => {
        expect(screen.getByText('Name : Test Laptop')).toBeInTheDocument();
      });
      expect(await screen.findByText('Related Mouse')).toBeInTheDocument();
      expect(await screen.findByText('Related Keyboard')).toBeInTheDocument();

      const addToCartButton = screen.getByText('ADD TO CART');
      fireEvent.click(addToCartButton);

      const cartData = JSON.parse(localStorage.getItem('cart'));
      expect(cartData).toHaveLength(1);
      expect(cartData[0].name).toBe('Test Laptop');
      expect(cartData[0].price).toBe(999);
    });

    test('should add multiple items to cart', async () => {
      renderComponent(testProduct.slug);

      await waitFor(() => {
        expect(screen.getByText('Name : Test Laptop')).toBeInTheDocument();
      });
      expect(await screen.findByText('Related Mouse')).toBeInTheDocument();
      expect(await screen.findByText('Related Keyboard')).toBeInTheDocument();

      const addToCartButton = screen.getByText('ADD TO CART');
      fireEvent.click(addToCartButton);
      fireEvent.click(addToCartButton);

      const cartData = JSON.parse(localStorage.getItem('cart'));
      expect(cartData).toHaveLength(2);
    });
  });

  describe('End-to-End Flow', () => {
    test('should complete full flow: load product, view related, add to cart', async () => {
      renderComponent(testProduct.slug);

      // Product loads
      await waitFor(() => {
        expect(screen.getByText('Name : Test Laptop')).toBeInTheDocument();
      });

      // Related products load
      expect(await screen.findByText('Related Mouse')).toBeInTheDocument();
      expect(await screen.findByText('Related Keyboard')).toBeInTheDocument();

      // Add to cart
      fireEvent.click(screen.getByText('ADD TO CART'));

      const cartData = JSON.parse(localStorage.getItem('cart'));
      expect(cartData).toHaveLength(1);
      expect(cartData[0]._id).toBe(testProduct._id.toString());
    });
  });
});