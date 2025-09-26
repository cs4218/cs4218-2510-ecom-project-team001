import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter, useParams } from "react-router-dom";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";

// Mock dependencies
jest.mock("axios");
jest.mock("../components/Layout", () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

const mockedAxios = axios;
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(() => ({ slug: "electronics" })),
  useNavigate: () => mockNavigate,
}));

const mockUseParams = jest.mocked(useParams);

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("CategoryProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCategoryData = {
    category: {
      _id: "cat1",
      name: "Electronics",
      slug: "electronics"
    },
    products: [
      {
        _id: "prod1",
        name: "Laptop",
        slug: "laptop",
        price: 999.99,
        description: "High performance laptop with excellent features for work and gaming"
      },
      {
        _id: "prod2",
        name: "Smartphone",
        slug: "smartphone",
        price: 699.99,
        description: "Latest smartphone with advanced camera and fast processor"
      }
    ]
  };

  describe("Component Rendering", () => {
    test("renders loading state initially", () => {
      // Arrange
      mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      // Assert
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });

    test("renders category name and product count after loading", async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      // Act
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      // Assert
      expect(await screen.findByText("Category - Electronics")).toBeInTheDocument();
      expect(await screen.findByText("2 result found")).toBeInTheDocument();
    });

    test("renders products correctly", async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      // Act
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      // Assert
      const laptop = await screen.findByText("Laptop");
      const smartphone = await screen.findByText("Smartphone");
      const laptopPrice = await screen.findByText("$999.99");
      const smartphonePrice = await screen.findByText("$699.99");

      expect(laptop).toBeInTheDocument();
      expect(smartphone).toBeInTheDocument();
      expect(laptopPrice).toBeInTheDocument();
      expect(smartphonePrice).toBeInTheDocument();
    });

    test("does not crash when category is not found", async () => {
      // Arrange
      mockUseParams.mockResolvedValueOnce({slug: "non-exists"});
      mockedAxios.get.mockResolvedValue({ data: 
        {
          category: null,
          products: null
        }
      });

      // Act
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      // Assert
      expect(await screen.findByText("Category -")).toBeInTheDocument();
    });

    test("handles empty products array", async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ 
        data: { 
          category: { name: "Electronics" }, 
          products: [] 
        } 
      });

      // Act
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      // Assert
      expect(await screen.findByText("Category - Electronics")).toBeInTheDocument();
      expect(await screen.findByText("0 result found")).toBeInTheDocument();
    });

    test("truncates product descriptions correctly", async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      // Act
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      // Assert
      // This is > 60 chars
      const laptopText = await screen.findByText(
       "High performance laptop with excellent features for work and..."
      );

      // This is <= 60 chars
      const smartphoneText = await screen.findByText(
       "Latest smartphone with advanced camera and fast processor"
      );

      expect(laptopText).toBeInTheDocument();
      expect(smartphoneText).toBeInTheDocument();
    });

    test("renders product images with correct src and alt attributes", async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      // Act
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );
      
      // Assert
      const laptopImage = await screen.findByAltText("Laptop");
      const smartphoneImage = await screen.findByAltText("Smartphone");
        
      expect(laptopImage).toHaveAttribute("src", "/api/v1/product/product-photo/prod1");
      expect(smartphoneImage).toHaveAttribute("src", "/api/v1/product/product-photo/prod2");
      
    });
  });

  describe("API Integration", () => {
    test("calls API with correct slug parameter", async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      // Act
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/product/product-category/electronics");
      });
    });

    test("does not call API when slug is not provided", () => {
      // Arrange
      mockUseParams.mockResolvedValueOnce({});
      
      // Act
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      // Assert
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    test("handles API errors gracefully", async () => {
      // Arrange
      const consoleLogSpy = jest.spyOn(console, "error").mockImplementation();
      mockedAxios.get.mockRejectedValue(new Error("API Error"));

      // Act
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      // Assert
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleLogSpy.mockRestore();
    });
  });

  describe("Navigation", () => {
    test("navigates to product detail page when More Details button is clicked", async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      // Act
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      const moreDetailsButtons = await screen.findAllByText("More Details");

      // Act + Assert
      fireEvent.click(moreDetailsButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith("/product/laptop");
    });

    test("navigates correctly for multiple products", async () => {
      // Arrange
      mockedAxios.get.mockResolvedValue({ data: mockCategoryData });

      // Act
      render(
        <TestWrapper>
          <CategoryProduct />
        </TestWrapper>
      );

      const moreDetailsButtons = await screen.findAllByText("More Details");

      // Act + Assert
      fireEvent.click(moreDetailsButtons[1]);
      expect(mockNavigate).toHaveBeenCalledWith("/product/smartphone");

      // Act + Assert
      fireEvent.click(moreDetailsButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith("/product/laptop");
    });
  });
});