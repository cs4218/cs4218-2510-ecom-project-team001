import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "../components/Header";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import { connectToTestDb, resetTestDb, disconnectFromTestDb } from "../../../tests/utils/db.js";
import categoryModel from "../../../models/categoryModel.js";
import app from "../../../server.js";
import axios from "axios";
import toast from "react-hot-toast";

// Heavily uses Header unit tests code

jest.setTimeout(25000);

let server;
const TEST_PORT = 8081;

jest.mock("../components/Form/SearchInput", () => () => <div>SearchInput</div>);

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));


jest.mock("react-hot-toast");

describe("Header Component - Integration Tests", () => {
  beforeAll(async () => {
    await connectToTestDb("jest-header-int");
    server = app.listen(TEST_PORT);
    axios.defaults.baseURL = `http://localhost:${TEST_PORT}`;
  });

  afterAll(async () => {
    await disconnectFromTestDb();
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(async () => {
    await resetTestDb();
    jest.clearAllMocks();
    localStorage.clear();
    // Silence console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    await new Promise(res => setTimeout(res, 50));
  })

  const renderHeader = (initialAuth = null, initialCart = []) => {
    if (initialAuth) {
      localStorage.setItem("auth", JSON.stringify(initialAuth));
    }
    if (initialCart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(initialCart));
    }

    return render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <Header />
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  describe("Basic Rendering", () => {
    test("renders navbar with brand name", () => {
      renderHeader();
      const logoLink = screen.getByText("🛒 Virtual Vault");
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute("href", "/");
    });

    test("renders navigation toggle button", () => {
      renderHeader();
      const toggleButton = screen.getByRole("button", {
        name: /toggle navigation/i,
      });
      expect(toggleButton).toBeInTheDocument();
    });

    test("renders SearchInput component", () => {
      renderHeader();
      expect(screen.getByText("SearchInput")).toBeInTheDocument();
    });

    test("renders Home link", () => {
      renderHeader();
      const homeLink = screen.getByRole("link", { name: /home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute("href", "/");
    });

    test("renders Categories dropdown", () => {
      renderHeader();
      expect(screen.getByText("Categories")).toBeInTheDocument();
    });

    test("renders Cart link", () => {
      renderHeader();
      expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument();
    });
  });

  describe("Categories Dropdown - Real API Integration", () => {
    test("renders categories fetched from API with correct links", async () => {
      await categoryModel.insertMany([
        { name: "Electronics", slug: "electronics" },
        { name: "Clothing", slug: "clothing" },
      ]);

      renderHeader();

      await waitFor(() => {
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });

      expect(screen.getByText("Clothing")).toBeInTheDocument();
      
      const electronicsLink = screen.getByRole("link", { name: "Electronics" });
      expect(electronicsLink).toHaveAttribute("href", "/category/electronics");
    });

    test("handles empty categories from API", async () => {
      renderHeader();

      await waitFor(() => {
        const allCategoriesLink = screen.getByRole("link", {
          name: /all categories/i,
        });
        expect(allCategoriesLink).toHaveAttribute("href", "/categories");
      });
    });
  });

  describe("Authentication State", () => {
    test("shows Register and Login for unauthenticated users", () => {
      renderHeader();

      expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
    });

    test("shows user dashboard and name for authenticated regular user", async () => {
      const authState = {
        user: { name: "John Doe", role: 0, email: "john@example.com" },
        token: "fake-token-123",
      };

      renderHeader(authState);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
      
      expect(screen.queryByRole("link", { name: /^register$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /^login$/i })).not.toBeInTheDocument();
    });

    test("shows admin dashboard for admin user", async () => {
      const adminAuthState = {
        user: { name: "Admin User", role: 1, email: "admin@example.com" },
        token: "admin-token-123",
      };

      renderHeader(adminAuthState);

      await waitFor(() => {
        const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
        expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
      });
    });
  });

  describe("Logout Functionality", () => {
    test("clears auth and cart state on logout", async () => {
      const authState = {
        user: { name: "John Doe", role: 0 },
        token: "fake-token-123",
      };
      const cartItems = [
        { _id: "1", name: "Product 1", price: 100 },
        { _id: "2", name: "Product 2", price: 200 },
      ];

      jest.setTimeout(3000);

      renderHeader(authState, cartItems);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      const logoutLink = screen.getByRole("link", { name: /logout/i });
      fireEvent.click(logoutLink);

      await waitFor(() => {
        expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
      });

      expect(await screen.findByRole("link", { name: /register/i })).toBeInTheDocument();

      expect(localStorage.getItem("auth")).toBeNull();
      expect(localStorage.getItem("cart")).toBeNull();
      expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
    });
  });

  describe("Cart Badge", () => {
    test("displays correct cart count", async () => {
      const cartItems = [
        { _id: "1", name: "Product 1" },
        { _id: "2", name: "Product 2" },
        { _id: "3", name: "Product 3" },
      ];

      renderHeader(null, cartItems);

      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });
    });
  });
});