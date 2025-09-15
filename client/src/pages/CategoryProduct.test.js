import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import CategoryProduct from './CategoryProduct';

// Mock dependencies
jest.mock('axios');
jest.mock('../components/Layout', () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

const mockedAxios = axios;
const mockNavigate = jest.fn();
const mockUseParams = require('react-router-dom').useParams;
const mockUseNavigate = require('react-router-dom').useNavigate;

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CategoryProduct Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  const mockCategoryData = {
    category: {
      _id: 'cat1',
      name: 'Electronics',
      slug: 'electronics'
    },
    products: [
      {
        _id: 'prod1',
        name: 'Laptop',
        slug: 'laptop',
        price: 999.99,
        description: 'High performance laptop with excellent features for work and gaming'
      },
      {
        _id: 'prod2',
        name: 'Smartphone',
        slug: 'smartphone',
        price: 699.99,
        description: 'Latest smartphone with advanced camera and fast processor'
      }
    ]
  };

  describe('Component Rendering', () => {
    test('renders loading state initially', () => {
      mockUseParams.mockReturnValue({ slug: 'electronics' });
      mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });

    test('renders category name and product count after loading', async () => {
      mockUseParams.mockReturnValue({ slug: 'electronics' });
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      expect(await screen.findByText('Category - Electronics')).toBeInTheDocument();
      expect(await screen.findByText('2 result found')).toBeInTheDocument();
    });

    test('renders products correctly', async () => {
      mockUseParams.mockReturnValue({ slug: 'electronics' });
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      const laptop = await screen.findByText('Laptop');
      const smartphone = await screen.findByText('Smartphone');
      const laptopPrice = await screen.findByText('$999.99');
      const smartphonePrice = await screen.findByText('$699.99');

      expect(laptop).toBeInTheDocument();
      expect(smartphone).toBeInTheDocument();
      expect(laptopPrice).toBeInTheDocument();
      expect(smartphonePrice).toBeInTheDocument();
    });

    test('does not crash when category is not found', async () => {
      mockUseParams.mockReturnValue({ slug: 'nonexistent' });
      mockedAxios.get.mockResolvedValue({ data: 
        {
          category: null,
          products: null
        }
      });

      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      expect(await screen.findByText('Category -')).toBeInTheDocument();
    });

    test('handles empty products array', async () => {
      mockUseParams.mockReturnValue({ slug: 'electronics' });
      mockedAxios.get.mockResolvedValue({ 
        data: { 
          category: { name: 'Electronics' }, 
          products: [] 
        } 
      });

      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Category - Electronics')).toBeInTheDocument();
      });
      expect(screen.getByText('0 result found')).toBeInTheDocument();
    });

    test('truncates product descriptions correctly', async () => {
      mockUseParams.mockReturnValue({ slug: 'electronics' });
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      // This is > 60 chars
      const laptopText = await screen.findByText(
       'High performance laptop with excellent features for work and...'
      );

      // This is <= 60 chars
      const smartphoneText = await screen.findByText(
       'Latest smartphone with advanced camera and fast processor'
      );

      expect(laptopText).toBeInTheDocument();
      expect(smartphoneText).toBeInTheDocument();
    });

    test('renders product images with correct src and alt attributes', async () => {
      mockUseParams.mockReturnValue({ slug: 'electronics' });
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );
      
      const laptopImage = await screen.findByAltText('Laptop');
      const smartphoneImage = await screen.findByAltText('Smartphone');
        
      expect(laptopImage).toHaveAttribute('src', '/api/v1/product/product-photo/prod1');
      expect(smartphoneImage).toHaveAttribute('src', '/api/v1/product/product-photo/prod2');
      
    });
  });

  describe('API Integration', () => {
    test('calls API with correct slug parameter', async () => {
      mockUseParams.mockReturnValue({ slug: 'electronics' });
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/product/product-category/electronics');
      });
    });

    test('does not call API when slug is not provided', () => {
      mockUseParams.mockReturnValue({});
      
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    test('handles API errors gracefully', async () => {
      mockUseParams.mockReturnValue({ slug: 'electronics' });
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleLogSpy.mockRestore();
    });
  });

  describe('Navigation', () => {
    test('navigates to product detail page when More Details button is clicked', async () => {
      mockUseParams.mockReturnValue({ slug: 'electronics' });
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      const moreDetailsButtons = await screen.findAllByText('More Details');
      fireEvent.click(moreDetailsButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/product/laptop');
    });

    test('navigates correctly for multiple products', async () => {
      mockUseParams.mockReturnValue({ slug: 'electronics' });
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      const moreDetailsButtons = await screen.findAllByText('More Details');

      fireEvent.click(moreDetailsButtons[1]);
      expect(mockNavigate).toHaveBeenCalledWith('/product/smartphone');

      fireEvent.click(moreDetailsButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/product/laptop');
    });
  });
});