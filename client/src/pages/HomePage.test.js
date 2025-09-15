import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import HomePage from "./HomePage";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import { setCartMock } from '../context/cart';
import { navigateMock } from "react-router-dom";



// ---- Mocks ----
jest.mock("axios");
jest.mock("react-hot-toast", () => ({ success: jest.fn(), error: jest.fn() }));
jest.mock("./../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);
jest.mock("../components/Prices", () => ({
  Prices: [
    { _id: "p1", name: "Under $10", array: [0, 9.99] },
    { _id: "p2", name: "$10 - $19.99", array: [10, 19.99] },
    { _id: "p3", name: "$60 - $79.99", array: [60, 79.99] },
  ],
}));

jest.mock('../context/cart', () => {
    const setCartMock = jest.fn();
    return {
        useCart: () => [[], setCartMock],
        setCartMock
    }
});
  

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  const navigateMock = jest.fn();
  return { 
    ...actual, 
    useNavigate: () => navigateMock,
    navigateMock
};
});

const renderHome = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );

// Test helper for error scenarios
const mockAxiosError = (errorMessage) => {
  return Promise.reject(new Error(errorMessage));
};

beforeEach(() => {
  jest.clearAllMocks();

  // fresh localStorage spies
  const store = {};
  jest.spyOn(window.localStorage.__proto__, "setItem").mockImplementation((k, v) => (store[k] = String(v)));
  jest.spyOn(window.localStorage.__proto__, "getItem").mockImplementation((k) => store[k] ?? null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders banner and 'All Products' heading", async () => {
  // Arrange
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: [] } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 0 } });
    if (url.startsWith("/api/v1/product/product-list/")) return Promise.resolve({ data: { products: [] } });
    return Promise.resolve({ data: {} });
  });

  // Act
  renderHome();

  // Assert
  expect(screen.getByAltText(/bannerimage/i)).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: /All Products/i })).toBeInTheDocument();
});

test("fetches categories, total, and page 1 products on mount", async () => {
  // Arrange
  const categories = [{ _id: "c1", name: "Books" }, { _id: "c2", name: "Gadgets" }];
  const products = [
    { _id: "a1", name: "Alpha", price: 5, description: "desc A", slug: "alpha" },
    { _id: "a2", name: "Beta", price: 15, description: "desc B", slug: "beta" },
  ];
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: categories } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 2 } });
    if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products } });
    return Promise.resolve({ data: {} });
  });

  // Act
  renderHome();

  // Assert
  expect(await screen.findByText("Books")).toBeInTheDocument();
  expect(screen.getByText("Gadgets")).toBeInTheDocument();
  expect(await screen.findByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
  expect(screen.getByRole("article", { name: "Product: Beta" })).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count");
  expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
});

test("renders price radios from Prices", async () => {
  // Arrange
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: [] } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 0 } });
    if (url.startsWith("/api/v1/product/product-list/")) return Promise.resolve({ data: { products: [] } });
    return Promise.resolve({ data: {} });
  });

  // Act
  renderHome();

  // Assert
  await screen.findByRole("heading", { name: /All Products/i });
  expect(screen.getByRole("radio", { name: "Under $10" })).toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "$10 - $19.99" })).toBeInTheDocument();
});

test("applies single category filter and replaces product list", async () => {
    // Arrange
    const categories = [{ _id: "c1", name: "Books" }, { _id: "c2", name: "Clothing" }];
    const initial = [
        { _id: "a1", name: "Book A`", price: 5, description: "A", slug: "book" },
        { _id: "a2", name: "Clothes B", price: 15, description: "B", slug: "clothes" },
    ];
    const filtered = [{ _id: "a1", name: "Book A`", price: 5, description: "A", slug: "book" }];

    axios.get.mockImplementation((url) => {
        if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: categories } });
        if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 10 } });
        if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products: initial } });
        return Promise.resolve({ data: {} });
    });
    axios.post.mockResolvedValue({ data: { products: filtered } });

    renderHome();
    await screen.findByRole("article", { name: "Product: Book A`" });
    await screen.findByRole("article", { name: "Product: Clothes B" });

    // Act
    fireEvent.click(screen.getByRole("checkbox", { name: "Books" }));

    //Assert
    await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
            checked: ["c1"],
            radio: [],
        });
    });
    await waitFor(async () => {
        expect(await screen.findByRole("article", { name: "Product: Book A`" })).toBeInTheDocument();
    });
    await waitFor(() => {
        expect(screen.queryByRole("article", { name: "Product: Clothes B" })).not.toBeInTheDocument();
    });
})

test("applies multiple category filters and replaces product list", async () => {
    // Arrange
    const categories = [
        { _id: "c1", name: "Books" }, 
        { _id: "c2", name: "Clothing" },
        { _id: "c3", name: "Electronics" }
    ];
    const initial = [
        { _id: "a1", name: "Book A`", price: 5, description: "A", slug: "book" },
        { _id: "a2", name: "Clothes B", price: 15, description: "B", slug: "clothes" },
        { _id: "a3", name: "Electronics C", price: 25, description: "C", slug: "electronics" }
    ];
    const filtered = [
        { _id: "a1", name: "Book A`", price: 5, description: "A", slug: "book" },
        { _id: "a2", name: "Clothes B", price: 15, description: "B", slug: "clothes" }
    ];

    axios.get.mockImplementation((url) => {
        if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: categories } });
        if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 2 } });
        if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products: initial } });
        return Promise.resolve({ data: {} });
    });
    axios.post.mockResolvedValue({ data: { products: filtered } });

    renderHome();
    await screen.findByRole("article", { name: "Product: Book A`" });
    await screen.findByRole("article", { name: "Product: Clothes B" });
    await screen.findByRole("article", { name: "Product: Electronics C" });

    // Act
    fireEvent.click(screen.getByRole("checkbox", { name: "Books" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Clothing" }));

    //Assert
    await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
            checked: ["c1", "c2"],
            radio: [],
        });
    });
    await waitFor(async () => {
        expect(await screen.findByRole("article", { name: "Product: Book A`" })).toBeInTheDocument();
    })
    await waitFor(async () => {
        expect(await screen.findByRole("article", { name: "Product: Clothes B" })).toBeInTheDocument();
    })
    await waitFor(() => {
        expect(screen.queryByRole("article", { name: "Product: Electronics C" })).not.toBeInTheDocument();
    })
})

test("applies single price filter and replaces product list", async () => {
    // Arrange
    const initial = [
        { _id: "a1", name: "Alpha", price: 79, description: "A", slug: "alpha" },
        { _id: "a2", name: "Beta", price: 79.99, description: "B", slug: "beta" },
        { _id: "a3", name: "Gamma", price: 65, description: "C", slug: "gamma" },
        { _id: "a4", name: "Delta", price: 60, description: "D", slug: "delta" },
        { _id: "a5", name: "Epsilon", price: 59.99, description: "E", slug: "epsilon" },
    ]
    const filtered = [
        { _id: "a1", name: "Alpha", price: 79, description: "A", slug: "alpha" },
        { _id: "a2", name: "Beta", price: 79.99, description: "B", slug: "beta" },
        { _id: "a3", name: "Gamma", price: 65, description: "C", slug: "gamma" },
        { _id: "a4", name: "Delta", price: 60, description: "D", slug: "delta" },
    ]
    axios.get.mockImplementation((url) => {
        if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 10 } });
        if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products: initial } });
        return Promise.resolve({ data: {} });
    });
    axios.post.mockResolvedValue({ data: { products: filtered } });
    renderHome();
    await screen.findByRole("article", { name: "Product: Alpha" });
    await screen.findByRole("article", { name: "Product: Beta" });
    await screen.findByRole("article", { name: "Product: Gamma" });
    await screen.findByRole("article", { name: "Product: Delta" });
    await screen.findByRole("article", { name: "Product: Epsilon" });

    // Act
    fireEvent.click(screen.getByRole("radio", { name: "$60 - $79.99" }));
    
    // Assert
    await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
            checked: [],
            radio: [60, 79.99],
        });
    });
    await waitFor(async () => {
        expect(await screen.findByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
    })
    await waitFor(async () => {
        expect(await screen.findByRole("article", { name: "Product: Beta" })).toBeInTheDocument();
    })
    await waitFor(async () => {
        expect(await screen.findByRole("article", { name: "Product: Gamma" })).toBeInTheDocument();
    })
    await waitFor(async () => {
        expect(await screen.findByRole("article", { name: "Product: Delta" })).toBeInTheDocument();
    })
    await waitFor(() => {
        expect(screen.queryByRole("article", { name: "Product: Epsilon" })).not.toBeInTheDocument();
    })
})

test("applies category + price filters and replaces product list", async () => {
  // Arrange
  const categories = [{ _id: "c1", name: "Books" }];
  const initial = [{ _id: "a1", name: "Alpha", price: 5, description: "A", slug: "alpha" }];
  const filtered = [{ _id: "f1", name: "Filtered", price: 12, description: "filtered", slug: "filtered" }];

  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: categories } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 10 } });
    if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products: initial } });
    return Promise.resolve({ data: {} });
  });
  axios.post.mockResolvedValue({ data: { products: filtered } });

  renderHome();
  await screen.findByRole("article", { name: "Product: Alpha" });

  // Act
  fireEvent.click(screen.getByRole("checkbox", { name: "Books" }));
  fireEvent.click(screen.getByRole("radio", { name: "$10 - $19.99" }));

  // Assert
  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
      checked: ["c1"],
      radio: [10, 19.99],
    });
  });
  expect(await screen.findByRole("article", { name: "Product: Filtered" })).toBeInTheDocument();
  expect(screen.queryByRole("article", { name: "Product: Alpha" })).not.toBeInTheDocument();
});


test("shows 'Loadmore' when products.length < total; loads next page and then hides", async () => {
  // Arrange
  const page1 = [
    { _id: "a1", name: "Alpha", price: 5, description: "A", slug: "alpha" },
    { _id: "a2", name: "Beta", price: 15, description: "B", slug: "beta" },
  ];
  const page2 = [{ _id: "a3", name: "Gamma", price: 25, description: "C", slug: "gamma" }];

  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: [] } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 3 } });
    if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products: page1 } });
    if (url === "/api/v1/product/product-list/2") return Promise.resolve({ data: { products: page2 } });
    return Promise.resolve({ data: {} });
  });

  renderHome();
  await screen.findByRole("article", { name: "Product: Alpha" });

  // Act
  const loadBtn = screen.getByRole("button", { name: /Loadmore/i });
  fireEvent.click(loadBtn);

  // Assert
  expect(await screen.findByRole("article", { name: "Product: Gamma" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Loadmore/i })).not.toBeInTheDocument();
});

test('hides loadmore button on filtered products', async () => {
  // Arrange
  const categories = [
        { _id: "c1", name: "Books" }, 
        { _id: "c2", name: "Clothing" },
        { _id: "c3", name: "Electronics" }
  ];
  const initial = [
        { _id: "a1", name: "Book A`", price: 5, description: "A", slug: "book" },
        { _id: "a2", name: "Clothes B", price: 15, description: "B", slug: "clothes" },
  ];
  const filtered = [
      { _id: "a1", name: "Book A`", price: 5, description: "A", slug: "book" },
  ];

  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: categories } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 2 } });
    if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products: initial } });
    return Promise.resolve({ data: {} });
  });
  axios.post.mockResolvedValue({ data: { products: filtered } });

  renderHome();
  await screen.findByRole("article", { name: "Product: Book A`" });
  await screen.findByRole("article", { name: "Product: Clothes B" });

  // Act
  fireEvent.click(screen.getByRole("checkbox", { name: "Books" }));
  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
      checked: ["c1"],
      radio: [],
    });
  });

  await waitFor(async () => {
      expect(await screen.findByRole("article", { name: "Product: Book A`" })).toBeInTheDocument();
  });
  await waitFor(() => {
    expect(screen.queryByRole("button", { name: /Loadmore/i })).not.toBeInTheDocument();
  });

})

test('navigates to details on "More Details"', async () => {
  // Arrange
  const products = [{ _id: "a1", name: "Alpha", price: 5, description: "A", slug: "alpha" }];
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: [] } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 1 } });
    if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products } });
    return Promise.resolve({ data: {} });
  });

  renderHome();
  const alphaCard = await screen.findByRole("article", { name: "Product: Alpha" });

  // Act
  fireEvent.click(within(alphaCard).getByRole("button", { name: /More Details/i }));

  // Assert
  expect(navigateMock).toHaveBeenCalledWith(`/product/${products[0].slug}`);
});

test('adds to cart, persists, and toasts on "ADD TO CART"', async () => {
  // Arrange
  const products = [{ _id: "a1", name: "Alpha", price: 5, description: "A", slug: "alpha" }];
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: [] } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 1 } });
    if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products } });
    return Promise.resolve({ data: {} });
  });

  renderHome();
  const alphaCard = await screen.findByRole("article", { name: "Product: Alpha" });

  // Act
  fireEvent.click(within(alphaCard).getByRole("button", { name: "ADD TO CART" }));

  // Assert
  expect(setCartMock).toHaveBeenCalledTimes(1);
  expect(window.localStorage.setItem).toHaveBeenCalledWith("cart", expect.stringContaining('"name":"Alpha"'));
  expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
});

test("RESET FILTERS triggers window.location.reload()", async () => {
  // Arrange
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: [] } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 0 } });
    if (url.startsWith("/api/v1/product/product-list/")) return Promise.resolve({ data: { products: [] } });
    return Promise.resolve({ data: {} });
  });

  const originalLocation = window.location;
  delete window.location;
  window.location = { ...originalLocation, reload: jest.fn() };

  renderHome();
  await screen.findByRole("heading", { name: /All Products/i });

  // Act
  fireEvent.click(screen.getByRole("button", { name: /RESET FILTERS/i }));

  // Assert
  expect(window.location.reload).toHaveBeenCalled();

  // cleanup
  window.location = originalLocation;
});

test("prices are formatted as USD inside each product card", async () => {
  // Arrange
  const products = [{ _id: "a1", name: "Alpha", price: 5, description: "A", slug: "alpha" }];
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: [] } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 1 } });
    if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products } });
    return Promise.resolve({ data: {} });
  });

  // Act
  renderHome();
  const alphaCard = await screen.findByRole("article", { name: "Product: Alpha" });

  // Assert
  expect(within(alphaCard).getByText("$5.00")).toBeInTheDocument();
});

test("shows error when category fetch fails", async () => {
  // Arrange
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") {
      return mockAxiosError("Failed to get categories");
    }
    if (url === "/api/v1/product/product-count") {
      return Promise.resolve({ data: { total: 0 } });
    }
    if (url === "/api/v1/product/product-list/1") {
      return Promise.resolve({ data: { products: [] } });
    }
    return Promise.resolve({ data: {} });
  });

  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  // Act
  renderHome();

  // Assert
  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
  });

  expect(screen.getByAltText(/bannerimage/i)).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: /All Products/i })).toBeInTheDocument();
  expect(toast.error).toHaveBeenCalledWith("Failed to get categories");

  consoleSpy.mockRestore();
});

test("shows error when product count fetch fails", async () => {
  // Arrange
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") {
      return Promise.resolve({ data: { success: true, category: [] } });
    }
    if (url === "/api/v1/product/product-count") {
      return mockAxiosError("Failed to get total products");
    }
    if (url === "/api/v1/product/product-list/1") {
      return Promise.resolve({ data: { products: [] } });
    }
    return Promise.resolve({ data: {} });
  });

  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  // Act
  renderHome();

  // Assert
  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
  });

  expect(screen.getByAltText(/bannerimage/i)).toBeInTheDocument();
  expect(toast.error).toHaveBeenCalledWith("Failed to get total products");
  consoleSpy.mockRestore();
});

test("shows error when product list fetch fails", async () => {
  // Arrange
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") {
      return Promise.resolve({ data: { success: true, category: [] } });
    }
    if (url === "/api/v1/product/product-count") {
      return Promise.resolve({ data: { total: 5 } });
    }
    if (url === "/api/v1/product/product-list/1") {
      return mockAxiosError("Failed to get products");
    }
    return Promise.resolve({ data: {} });
  });

  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  // Act
  renderHome();

  // Assert
  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
  });

  expect(screen.getByAltText(/bannerimage/i)).toBeInTheDocument();
  expect(toast.error).toHaveBeenCalledWith("Failed to get products");
  consoleSpy.mockRestore();
});

test("shows error when filter products fails", async () => {
  // Arrange
  const categories = [{ _id: "c1", name: "Books" }];
  const products = [{ _id: "p1", name: "Test Product", price: 10, description: "Test Description", slug: "test" }];

  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") {
      return Promise.resolve({ data: { success: true, category: categories } });
    }
    if (url === "/api/v1/product/product-count") {
      return Promise.resolve({ data: { total: 1 } });
    }
    if (url === "/api/v1/product/product-list/1") {
      return Promise.resolve({ data: { products } });
    }
    return Promise.resolve({ data: {} });
  });

  // Mock filter to fail
  axios.post.mockImplementation((url) => {
    if (url === "/api/v1/product/product-filters") {
      return mockAxiosError("Failed to filter products");
    }
    return Promise.resolve({ data: {} });
  });

  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  // Act
  renderHome();
  await screen.findByRole("article", { name: "Product: Test Product" });

  // Apply filter that will fail
  const filterBtn = screen.getByRole("checkbox", { name: "Books" });
  fireEvent.click(filterBtn);

  // Assert
  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
  });
  expect(toast.error).toHaveBeenCalledWith("Failed to filter products");

  consoleSpy.mockRestore();
});

test("shows error when load more fails", async () => {
  // Arrange
  const page1 = [
    { _id: "a1", name: "Alpha", price: 5, description: "A", slug: "alpha" },
    { _id: "a2", name: "Beta", price: 15, description: "B", slug: "beta" },
  ];

  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: [] } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 3 } });
    if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products: page1 } });
    if (url === "/api/v1/product/product-list/2") return mockAxiosError("Failed to load more products");
    return Promise.resolve({ data: {} });
  });
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  renderHome();
  await screen.findByRole("article", { name: "Product: Alpha" });

  // Act
  const loadBtn = screen.getByRole("button", { name: /Loadmore/i });
  fireEvent.click(loadBtn);

  // Assert
  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
  });
  expect(toast.error).toHaveBeenCalledWith("Failed to load more products");
  expect(screen.getByRole("article", { name: "Product: Alpha" })).toBeInTheDocument();
  expect(screen.getByRole("article", { name: "Product: Beta" })).toBeInTheDocument();

  consoleSpy.mockRestore();
});

test('shows message when no products found on initial fetch', async () => {
  // Arrange
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: [] } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 0 } });
    if (url.startsWith("/api/v1/product/product-list/")) return Promise.resolve({ data: { products: [] } });
    return Promise.resolve({ data: {} });
  });

  // Act
  renderHome();

  // Assert
  expect(await screen.findByText("No Products Found")).toBeInTheDocument();
})

test('shows message when no products found on filtering', async () => {
  // Arrange
  const categories = [
    { _id: "c1", name: "Books" },
    { _id: "c2", name: "Clothing" },
    { _id: "c3", name: "Electronics" }
  ];
  const initial = [
      { _id: "a1", name: "Book A`", price: 5, description: "A", slug: "book" },
      { _id: "a2", name: "Clothes B", price: 15, description: "B", slug: "clothes" },
  ];

  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") return Promise.resolve({ data: { success: true, category: categories } });
    if (url === "/api/v1/product/product-count") return Promise.resolve({ data: { total: 10 } });
    if (url === "/api/v1/product/product-list/1") return Promise.resolve({ data: { products: initial } });
    return Promise.resolve({ data: {} });
  });
  axios.post.mockResolvedValue({ data: { products: [] } });

  renderHome();
  await screen.findByRole("article", { name: "Product: Book A`" });
  await screen.findByRole("article", { name: "Product: Clothes B" });

  // Act
  fireEvent.click(screen.getByRole("checkbox", { name: "Electronics" }));

  // Assert
  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
      checked: ["c3"],
      radio: [],
    });
  });

  expect(await screen.findByText("No Products Found")).toBeInTheDocument();
  expect(screen.queryByRole("article", { name: "Product: Book A`" })).not.toBeInTheDocument();
  expect(screen.queryByRole("article", { name: "Product: Clothes B" })).not.toBeInTheDocument();

})