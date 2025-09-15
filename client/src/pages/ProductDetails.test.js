import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter, useParams } from "react-router-dom";
import ProductDetails from "./ProductDetails";
import axios from "axios";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";

// Mock axios
jest.mock("axios");
const mockedAxios = axios;

jest.mock("react-hot-toast");
const mockedToast = toast;

const mockNavigate = jest.fn();

// Mock react-router-dom - create mocks inside the callback
jest.mock("react-router-dom", () => {
  const originalModule = jest.requireActual("react-router-dom");
  return {
    __esModule: true,
    ...originalModule,
    useParams: jest.fn(() => ({ slug: "test-product-slug" })),
    useNavigate: () => mockNavigate,
  };
});

const mockUseParams = jest.mocked(useParams);

jest.mock("../context/cart");
const mockedUseCart = useCart;

// Mock Layout component
jest.mock("../components/Layout", () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Test data
const mockProduct = {
  _id: "product123",
  name: "Test Product",
  description: "This is a test product description",
  price: 29.99,
  category: {
    _id: "category123",
    name: "Test Category"
  }
};

const mockRelatedProducts = [
  {
    _id: "related1",
    name: "Related Product 1",
    description: "This is a related product with a long description that should be truncated",
    price: 19.99,
    slug: "related-product-1"
  },
  {
    _id: "related2",
    name: "Related Product 2",
    description: "Another related product",
    price: 39.99,
    slug: "related-product-2"
  }
];

// Wrapper component for Router context
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("ProductDetails Component", () => {
  const mockCart = [];
  const mockSetCart = jest.fn();
  let localStorageMock;
  
  beforeEach(() => {
    jest.clearAllMocks();

    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
    };

    mockedUseCart.mockReturnValue([mockCart, mockSetCart]);
    console.log = jest.fn(); // Mock console.log to avoid error logs in tests
    console.error = jest.fn(); // Mock console.error as well
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders product details correctly when data is loaded", async () => {
    // Mock successful API responses
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { product: mockProduct }
      })
      .mockResolvedValueOnce({
        data: { products: mockRelatedProducts }
      });

    render(
      <RouterWrapper>
        <ProductDetails />
      </RouterWrapper>
    );

    // Wait for product data to load
    expect(await screen.findByText("Product Details")).toBeInTheDocument();
    expect(await screen.findByText("Name : Test Product")).toBeInTheDocument();
    expect(await screen.findByText("Description : This is a test product description")).toBeInTheDocument();
    expect(await screen.findByText(/Price\s*:\s*\$29\.99/)).toBeInTheDocument();
    expect(await screen.findByText("Category : Test Category")).toBeInTheDocument();
  });

  test("makes correct API calls on component mount", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { product: mockProduct }
      })
      .mockResolvedValueOnce({
        data: { products: mockRelatedProducts }
      });

    render(
      <RouterWrapper>
        <ProductDetails />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    // Check API endpoints
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/product/get-product/test-product-slug");
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/v1/product/related-product/product123/category123");
  });

  test("displays related products correctly", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { product: mockProduct }
      })
      .mockResolvedValueOnce({
        data: { products: mockRelatedProducts }
      });

    render(
      <RouterWrapper>
        <ProductDetails />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Similar Products ➡️")).toBeInTheDocument();
    });

    // Check related products
    expect(await screen.findByText("Related Product 1")).toBeInTheDocument();
    expect(await screen.findByText("Related Product 2")).toBeInTheDocument();
    expect(await screen.findByText("$19.99")).toBeInTheDocument();
    expect(await screen.findByText("$39.99")).toBeInTheDocument();

    // Check truncated description
    expect(await screen.findByText("This is a related product with a long description that shoul...")).toBeInTheDocument();
  });


  test("displays 'No Similar Products found' when no related products", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { product: mockProduct }
      })
      .mockResolvedValueOnce({
        data: { products: [] }
      });

    render(
      <RouterWrapper>
        <ProductDetails />
      </RouterWrapper>
    );

    expect(await screen.findByText("No Similar Products found")).toBeInTheDocument();
    
  });

  test("handles API errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedAxios.get.mockRejectedValue(new Error("API Error"));

    render(
      <RouterWrapper>
        <ProductDetails />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(new Error("API Error"));
    });

    expect(await screen.findByText("Product Details")).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test("navigates to product details when 'More Details' button is clicked", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { product: mockProduct }
      })
      .mockResolvedValueOnce({
        data: { products: mockRelatedProducts }
      });

    render(
      <RouterWrapper>
        <ProductDetails />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Similar Products ➡️")).toBeInTheDocument();
    });

    // Find and click the "More Details" button for the first related product
    const moreDetailsButtons = await screen.findAllByText("More Details");
    expect(moreDetailsButtons).toHaveLength(2);

    fireEvent.click(moreDetailsButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/product/related-product-1");
  });

  test("renders product image with correct src and alt attributes", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { product: mockProduct }
      })
      .mockResolvedValueOnce({
        data: { products: mockRelatedProducts }
      });

    render(
      <RouterWrapper>
        <ProductDetails />
      </RouterWrapper>
    );

    const productImage = await screen.findByAltText("Test Product");

    expect(productImage).toBeInTheDocument();
    expect(productImage).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/product123"
    );
  });

  test("does not fetch product and navigates to 404 page if no slug in params", () => {
    mockUseParams.mockResolvedValueOnce({});

    render(
      <RouterWrapper>
        <ProductDetails />
      </RouterWrapper>
    );

    // Should not make any API calls
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  test("does not crash if no product is found", async () => {
    mockedAxios.get
            .mockResolvedValueOnce({
                data: { product: null }
            })
            .mockResolvedValueOnce({
                data: { products: [] }
            });

    render(
      <RouterWrapper>
        <ProductDetails />
      </RouterWrapper>
    );

    // Does not crash
    expect(await screen.findByText("Product Details")).toBeInTheDocument();
  });

  test("renders ADD TO CART button", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { product: mockProduct }
      })
      .mockResolvedValueOnce({
        data: { products: [] }
      });

    render(
      <RouterWrapper>
        <ProductDetails />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "ADD TO CART" })).toBeInTheDocument();
    });
  });


  test("renders ADD TO CART button and adds item to localStorage when clicked", async () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });

    mockedAxios.get
      .mockResolvedValueOnce({
        data: { product: mockProduct }
      })
      .mockResolvedValueOnce({
        data: { products: [] }
      });

    render(
      <RouterWrapper>
        <ProductDetails />
      </RouterWrapper>
    );

    // Wait for product details to be rendered
    await screen.findByText("Name : Test Product");

    // Click the ADD TO CART button
    const addToCartButton = screen.getByText("ADD TO CART");
    fireEvent.click(addToCartButton);

    // Verify that the item was added to cart state
    expect(mockSetCart).toHaveBeenCalledWith([mockProduct]);
    
    // Verify that localStorage was updated with the cart item
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([mockProduct])
    );

    // Verify that success toast was shown
    expect(mockedToast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  test("handles ADD TO CART button click with existing item in cart", async () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });

    const mockExistingProduct = {
        _id: "product123",
        name: "Test Product Existing",
        description: "This is a test product description",
        price: 29.99,
        category: {
          _id: "category123",
          name: "Test Category"
        }
    };

    mockedAxios.get
      .mockResolvedValueOnce({
        data: { product: mockProduct }
      })
      .mockResolvedValueOnce({
        data: { products: [] }
      });

    mockCart.push(mockExistingProduct);

    render(
      <RouterWrapper>
        <ProductDetails />
      </RouterWrapper>
    );

    // Wait for product details to be rendered
    await screen.findByText("Name : Test Product");

    // Click the ADD TO CART button
    const addToCartButton = screen.getByText("ADD TO CART");
    fireEvent.click(addToCartButton);

    // Verify that the item was added to cart state
    expect(mockSetCart).toHaveBeenCalledWith([mockExistingProduct, mockProduct]);
    
    // Verify that localStorage was updated with the cart item
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([mockExistingProduct, mockProduct])
    );

    // Verify that success toast was shown
    expect(mockedToast.success).toHaveBeenCalledWith("Item Added to cart");
  });
});