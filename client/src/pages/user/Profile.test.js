import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "./Profile";
import axios from "axios";
import toast from "react-hot-toast";

// chatgpt is used to aid in creation of the unit tests
// Mock axios
jest.mock("axios");

// Mock toast
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock useAuth
let mockAuth;
let mockSetAuth;
jest.mock("../../context/auth", () => ({
  useAuth: () => [mockAuth, mockSetAuth],
}));

// Mock Layout & UserMenu
jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));
jest.mock("../../components/UserMenu", () => () => (
  <div data-testid="user-menu">UserMenu</div>
));

describe("Profile Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = {
      user: {
        name: "John Doe",
        email: "john@example.com",
        phone: "12345678",
        address: "123 Street",
      },
    };
    mockSetAuth = jest.fn();
    localStorage.setItem("auth", JSON.stringify(mockAuth));
  });

  //
  // 🔹 State-Based Tests
  //
  it("loads initial state from auth context via useEffect", () => {
    render(<Profile />);
    expect(screen.getByPlaceholderText(/Enter Your Name/i).value).toBe("John Doe");
    expect(screen.getByPlaceholderText(/Enter Your Email/i).value).toBe("john@example.com");
    expect(screen.getByPlaceholderText(/Enter Your Phone/i).value).toBe("12345678");
    expect(screen.getByPlaceholderText(/Enter Your Address/i).value).toBe("123 Street");
  });

  it("updates state when typing in editable fields", () => {
    render(<Profile />);
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Phone/i), {
        target: { value: "98765432" },
      });
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Address/i), {
      target: { value: "New Ave" },
    });
    expect(screen.getByPlaceholderText(/Enter Your Name/i).value).toBe("Jane Doe");
    expect(screen.getByPlaceholderText(/Enter Your Email/i).value).toBe("test@example.com");
    expect(screen.getByPlaceholderText(/Enter Your Phone/i).value).toBe("98765432");
    expect(screen.getByPlaceholderText(/Enter Your Address/i).value).toBe("New Ave");
  });

  it("keeps email field disabled", () => {
    render(<Profile />);
    const emailInput = screen.getByPlaceholderText(/Enter Your Email/i);
    expect(emailInput).toBeDisabled();
    expect(emailInput.value).toBe("john@example.com");
  });

  //
  // 🔹 Output-Based Tests
  //
  it("updates auth, localStorage, and shows success toast on success", async () => {
    const updatedUser = { ...mockAuth.user, name: "Jane Doe" };
    axios.put.mockResolvedValue({ data: { updatedUser } });

    render(<Profile />);
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith({ ...mockAuth, user: updatedUser });
      expect(JSON.parse(localStorage.getItem("auth")).user.name).toBe("Jane Doe");
      expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully");
    });
  });

  //
  // 🔹 Communications-Based Tests
  //
  it("calls axios.put with correct payload", async () => {
    axios.put.mockResolvedValue({ data: { updatedUser: mockAuth.user } });

    render(<Profile />);
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith("/api/v1/auth/profile", {
        name: "John Doe",
        email: "john@example.com",
        password: "",
        phone: "12345678",
        address: "123 Street",
      });
    });
  });

  //
  // 🔹 Error Handling
  //
  it("shows error toast if API call fails", async () => {
    axios.put.mockRejectedValue(new Error("Network error"));

    render(<Profile />);
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  it("shows error toast if backend responds with error field", async () => {
    axios.put.mockResolvedValue({
      data: { errro: true, error: "Invalid input" }, // matches typo in component
    });

    render(<Profile />);
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid input");
    });
  });

  //
  // 🔹 Equivalence Partitioning
  //
  it("submits correctly when password is empty", async () => {
    axios.put.mockResolvedValue({ data: { updatedUser: mockAuth.user } });

    render(<Profile />);
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Password/i), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });
  });

  it("submits correctly when password is non-empty", async () => {
    axios.put.mockResolvedValue({ data: { updatedUser: mockAuth.user } });

    render(<Profile />);
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Password/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/profile",
        expect.objectContaining({ password: "123456" })
      );
    });
  });

  //
  // 🔹 Boundary Value Analysis (BVA)
  //
  it("accepts empty strings for name, phone, and address", async () => {
    axios.put.mockResolvedValue({ data: { updatedUser: mockAuth.user } });

    render(<Profile />);
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Name/i), { target: { value: "" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Phone/i), { target: { value: "" } });
    fireEvent.change(screen.getByPlaceholderText(/Enter Your Address/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/auth/profile",
        expect.objectContaining({
          name: "",
          phone: "",
          address: "",
        })
      );
    });
  });
});
