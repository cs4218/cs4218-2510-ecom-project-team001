import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import JWT from "jsonwebtoken";
import toast from "react-hot-toast";

import app from "../../../../../server.js";
import userModel from "../../../../../models/userModel.js";
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from "../../../../../tests/utils/db.js";

import Profile from "../../../pages/user/Profile";


/*
chatgpt is used to aid in creation of the test cases below

=====================================================
Integration testing involving
1. controllers/authController.js (updateProfileController)
2. pages/user/Profile.js components
=====================================================

*/



jest.mock("../../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../../components/UserMenu", () => () => (
  <div data-testid="user-menu">UserMenuMock</div>
));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../context/auth", () => {
  let mockAuth = {
    token: "fake-jwt-token",
    user: {
      _id: "mockUserId",
      name: "OldName",
      email: "old@test.com",
      phone: "12345678",
      address: "Old Address",
    },
  };
  const setAuth = jest.fn((val) => {
    mockAuth = val;
  });
  return {
    useAuth: jest.fn(() => [mockAuth, setAuth]),
  };
});

describe("Profile Page - Integration", () => {
  let server;
  let port;
  let user;

  beforeAll(async () => {
    await connectToTestDb("profile-int-tests");
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(async () => {
    console.log.mockRestore();
    console.error.mockRestore();
    await disconnectFromTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    server = app.listen(7462);
    port = server.address().port;
    axios.defaults.baseURL = `http://localhost:${port}`;

    user = await userModel.create({
      name: "OldName",
      email: "old@test.com",
      password: "cs4218@test.com",
      phone: "12345678",
      address: "Old Address",
      answer: "sky",
    });

    const token = JWT.sign(
      { _id: user._id },
      process.env.JWT_SECRET || "test-secret"
    );
    axios.defaults.headers.common["authorization"] = token;

    localStorage.clear();
    localStorage.setItem(
      "auth",
      JSON.stringify({ token, user: user.toObject() })
    );
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    jest.clearAllMocks();
    cleanup();
  });

  const renderProfile = () =>
    render(
      <MemoryRouter initialEntries={["/dashboard/user/profile"]}>
        <Routes>
          <Route path="/dashboard/user/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

  describe("Initial Rendering", () => {
    test("renders layout, user menu and prefilled fields", async () => {
      renderProfile();

      expect(await screen.findByTestId("layout")).toBeInTheDocument();
      expect(await screen.findByTestId("user-menu")).toBeInTheDocument();
      expect(
        await screen.findByRole("heading", { name: /USER PROFILE/i })
      ).toBeInTheDocument();

      expect(screen.getByPlaceholderText(/Enter Your Name/i)).toHaveValue("OldName");
      expect(screen.getByPlaceholderText(/Enter Your Email/i)).toHaveValue("old@test.com");
      expect(screen.getByPlaceholderText(/Enter Your Phone/i)).toHaveValue("12345678");
      expect(screen.getByPlaceholderText(/Enter Your Address/i)).toHaveValue("Old Address");
    });
  });

  describe("Profile Update Integration", () => {
    test("successfully updates user profile", async () => {
      renderProfile();

      fireEvent.change(screen.getByPlaceholderText(/Enter Your Name/i), {
        target: { value: "NewName" },
      });
      fireEvent.change(screen.getByPlaceholderText(/Enter Your Email/i), {
        target: { value: "new@test.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/Enter Your Phone/i), {
        target: { value: "87654321" },
      });
      fireEvent.change(screen.getByPlaceholderText(/Enter Your Address/i), {
        target: { value: "New Address" },
      });
      fireEvent.change(screen.getByPlaceholderText(/Enter Your Password/i), {
        target: { value: "123456" },
      });

      fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully")
      );

      const updatedUser = await userModel.findOne({ email: "new@test.com" });
      expect(updatedUser).toBeTruthy();
      expect(updatedUser.name).toBe("NewName");
      expect(updatedUser.phone).toBe("87654321");
      expect(updatedUser.address).toBe("New Address");
    });

    test("rejects password shorter than 6 chars", async () => {
      renderProfile();

      fireEvent.change(screen.getByPlaceholderText(/Enter Your Password/i), {
        target: { value: "123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/Password.*6/))
      );
    });

    test("handles backend validation error gracefully", async () => {
      jest.spyOn(axios, "put").mockResolvedValueOnce({
        data: { error: "Email already exists" },
      });

      renderProfile();
      fireEvent.change(screen.getByPlaceholderText(/Enter Your Email/i), {
        target: { value: "duplicate@test.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Email already exists")
      );
    });

    test("handles network error gracefully", async () => {
      jest.spyOn(axios, "put").mockRejectedValueOnce(new Error("Network Error"));
      renderProfile();
      fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Something went wrong")
      );
    });

    test("persists updated values after re-render", async () => {
      renderProfile();

      const nameInput = screen.getByPlaceholderText(/Enter Your Name/i);
      const passwordInput = screen.getByPlaceholderText(/Enter Your Password/i);

      // Update and save
      fireEvent.change(nameInput, { target: { value: "Persistent Tester" } });
      fireEvent.change(passwordInput, { target: { value: "cs4218@test.com" } });
      fireEvent.click(screen.getByRole("button", { name: /UPDATE/i }));

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Profile Updated Successfully")
      );

      // Cleanup old render and remount
      cleanup();
      renderProfile();

      await waitFor(() =>
        expect(screen.getByPlaceholderText(/Enter Your Name/i)).toHaveValue("Persistent Tester")
      );
    });
  });
});
