import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import useCategory from "../hooks/useCategory";
import toast from "react-hot-toast";

// Mock dependencies
jest.mock("../context/auth");
jest.mock("../context/cart");
jest.mock("../hooks/useCategory");
jest.mock("react-hot-toast");
jest.mock("./Form/SearchInput", () => () => <div>SearchInput</div>);

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Header Component", () => {
  const mockSetAuth = jest.fn();
  const mockCategories = [
    { _id: "1", name: "Electronics", slug: "electronics" },
    { _id: "2", name: "Clothing", slug: "clothing" },
    { _id: "3", name: "Books", slug: "books" },
  ];
  // Mock generated using ChatGPT
  const localStorageMock = (function () {
    let store = {};

    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  })();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
    });
    useCategory.mockReturnValue(mockCategories);
  });

  const renderHeader = (authState = null, cartItems = []) => {
    useAuth.mockReturnValue([authState, mockSetAuth]);
    useCart.mockReturnValue([cartItems]);

    return render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
  };

  describe("Basic Rendering", () => {
    test("renders navbar with brand name", () => {
      // Arrange + Act
      renderHeader();
      // Assert
      const logoLink = screen.getByText("🛒 Virtual Vault");
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute("href", "/");
    });

    test("renders navigation toggle button", () => {
      // Arrange + Act
      renderHeader();
      // Assert
      const toggleButton = screen.getByRole("button", { name: /toggle navigation/i });
      expect(toggleButton).toBeInTheDocument();
    });

    test("renders SearchInput component", () => {
      // Arrange + Act
      renderHeader();
      // Assert
      expect(screen.getByText("SearchInput")).toBeInTheDocument();
    });

    test("renders Home link", () => {
      // Arrange + Act
      renderHeader();
      // Assert
      const homeLink = screen.getByRole("link", { name: /home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute("href", "/");
    });

    test("renders Categories dropdown", () => {
      // Arrange + Act
      renderHeader();
      // Assert
      expect(screen.getByText("Categories")).toBeInTheDocument();
    });

    test("renders Cart link", () => {
      // Arrange + Act
      renderHeader();
      // Assert
      expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument();
    });
  });

  describe("Categories Dropdown", () => {
    test("renders all categories in dropdown", () => {
      // Arrange + Act
      renderHeader();
      // Assert
      expect(screen.getByText("All Categories")).toBeInTheDocument();
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Clothing")).toBeInTheDocument();
      expect(screen.getByText("Books")).toBeInTheDocument();
    });

    test("category links have correct href", () => {
      // Arrange + Act
      renderHeader();
      // Assert
      const electronicsLink = screen.getByRole("link", { name: "Electronics" });
      expect(electronicsLink).toHaveAttribute("href", "/category/electronics");
    });

    test("handles empty categories array", () => {
      // Arrange
      useCategory.mockReturnValue([]);
      // Act
      renderHeader();
      // Assert
      const allCategoriesLink = screen.getByRole("link", { name: /all categories/i });
      expect(allCategoriesLink).toBeInTheDocument();
      expect(allCategoriesLink).toHaveAttribute("href", "/categories");
    });

    test("handles null categories", () => {
      // Arrange
      useCategory.mockReturnValue(null);
      // Act
      renderHeader();
      // Assert
      expect(screen.getByText("Categories")).toBeInTheDocument();
    });
  });

  // Used Equivalence Partitioning to partition users into unauthenticated user, authenticated regular user
  // and authenticated admin user
  describe("Unauthenticated User", () => {
    test("renders Register and Login links when user is not authenticated", () => {
      // Arrange + Act
      renderHeader(null);
      expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
    });

    test("does not render user dropdown when not authenticated", () => {
      // Arrange + Act
      renderHeader(null);
      expect(screen.queryByRole("button", { name: /dropdown-toggle/i })).not.toBeInTheDocument();
    });

    test("Register link has correct href", () => {
      // Arrange + Act
      renderHeader(null);
      const registerLink = screen.getByRole("link", { name: /register/i });
      expect(registerLink).toHaveAttribute("href", "/register");
    });

    test("Login link has correct href", () => {
      // Arrange + Act
      renderHeader(null);
      const loginLink = screen.getByRole("link", { name: /login/i });
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  describe("Authenticated User", () => {
    const mockUser = {
      name: "John Doe",
      role: 0,
      email: "john@example.com",
    };

    const mockAuthState = {
      user: mockUser,
      token: "fake-token-123",
    };

    test("renders Dashboard link for regular user", () => {
      // Arrange + Act
      renderHeader(mockAuthState);
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
    });

    test("renders Dashboard link for admin user", () => {
      // Arrange
      const adminAuthState = {
        user: { ...mockUser, role: 1 },
        token: "admin-token-123",
      };
      // Act
      renderHeader(adminAuthState);
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
    });

    test("renders user name when authenticated", () => {
      // Arrange + Act
      renderHeader(mockAuthState);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    test("does not render Register and Login links when authenticated", () => {
      // Arrange + Act
      renderHeader(mockAuthState);
      expect(screen.queryByRole("link", { name: /^register$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /^login$/i })).not.toBeInTheDocument();
    });

    test("renders Logout link", () => {
      // Arrange + Act
      renderHeader(mockAuthState);
      expect(screen.getByRole("link", { name: /logout/i })).toBeInTheDocument();
    });
  });

  describe("Logout Functionality", () => {
    const mockAuthState = {
      user: { name: "John Doe", role: 0 },
      token: "fake-token-123",
    };

    beforeEach(() => {
      localStorage.setItem("auth", JSON.stringify(mockAuthState));
    });

    test("calls handleLogout when logout link is clicked", () => {
      // Arrange + Act
      renderHeader(mockAuthState);
      const logoutLink = screen.getByRole("link", { name: /logout/i });
      fireEvent.click(logoutLink);

      // Assert
      expect(mockSetAuth).toHaveBeenCalledWith({
        ...mockAuthState,
        user: null,
        token: "",
      });
    });

    test("removes auth from localStorage on logout", () => {
      // Arrange + Act
      renderHeader(mockAuthState);
      const logoutLink = screen.getByRole("link", { name: /logout/i });
      fireEvent.click(logoutLink);

      // Assert
      expect(localStorage.getItem("auth")).toBeNull();
    });

    test("shows success toast on logout", () => {
      // Arrange + Act
      renderHeader(mockAuthState);
      const logoutLink = screen.getByRole("link", { name: /logout/i });
      fireEvent.click(logoutLink);

      // Assert
      expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
    });
  });
});