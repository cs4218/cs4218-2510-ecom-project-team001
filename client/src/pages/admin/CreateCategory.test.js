import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";

// Mock dependencies
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock UI components that are not under test
jest.mock("../../components/Layout", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));
jest.mock("../../components/AdminMenu", () => ({
  __esModule: true,
  default: () => null,
}));

// Render function to include JS in-memory MemoryRouter for routing context for components
// such as NavLink which uses BrowserRouter
const renderComponentWithRouter = (component) =>
  render(<MemoryRouter>{component}</MemoryRouter>);

describe("CreateCategory", () => {
  // Set-up / Clean-up state

  let logSpy, errorSpy;
  // Suppress console.log and console.error during tests
  beforeAll(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterAll(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
  beforeEach(() => {
    // Self-note: Clears call history, but does not reset implementation from mockImplementation,
    // or mockReturnValue etc.
    jest.clearAllMocks();
  });

  it("fetches and displays categories on render", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "TestCat" }] },
    });

    // Act - side effect of rendering
    renderComponentWithRouter(<CreateCategory />);

    // Assert
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    await screen.findByText("TestCat");
  });

  // Have 2 test specifications for separate error toasts test error test requirements/cases
  it("shows error toast if fetching categories fails", async () => {
    // Arrange
    axios.get.mockRejectedValueOnce(new Error("fail"));

    // Act - side effect of rendering
    renderComponentWithRouter(<CreateCategory />);

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("getting category")
      )
    );
  });

  it("shows error toast if response indicate failure", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: { success: false, message: "fail" },
    });

    // Act - side effect of rendering
    renderComponentWithRouter(<CreateCategory />);

    // Assert
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
  });

  it("creates a category on form submit", async () => {
    // Arrange
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    renderComponentWithRouter(<CreateCategory />);

    // Act
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "SomeCat" },
    });
    fireEvent.click(screen.getByText(/Submit/i));

    // Assert
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "SomeCat" }
      )
    );
    expect(toast.success).toHaveBeenCalledWith("SomeCat is created");
  });

  it("shows error toast if category creation fails", async () => {
    // Arrange
    axios.post.mockRejectedValueOnce(new Error("fail"));
    renderComponentWithRouter(<CreateCategory />);

    // Act
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "NewCat" },
    });
    fireEvent.click(screen.getByText("Submit"));

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/something went wrong/i)
      )
    );
  });

  it("clears form on form submit success", async () => {
    // Arrange
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    renderComponentWithRouter(<CreateCategory />);

    // Act
    const input = screen.getByRole("textbox");
    fireEvent.change(input, {
      target: { value: "SomeCat" },
    });

    // Assert
    expect(input.value).toBe("SomeCat");
    fireEvent.click(screen.getByText(/Submit/i));
    await waitFor(() => expect(input.value).toBe(""));
  });

  it("updates a category", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "SomeCat" }] },
    });
    axios.put.mockResolvedValueOnce({ data: { success: true } });
    renderComponentWithRouter(<CreateCategory />);

    // Act
    await screen.findByText("SomeCat");

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByDisplayValue("SomeCat"), {
      target: { value: "UpdatedCat" },
    });
    // Fire a submit click event within the modal dialog
    const modal = await screen.findByRole("dialog", {
      name: /update category/i,
    });
    fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));

    // Assert
    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/category/update-category/1",
        { name: "UpdatedCat" }
      )
    );
    expect(toast.success).toHaveBeenCalledWith("UpdatedCat is updated");
  });

  it("shows error toast if category update fails", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "SomeCat" }] },
    });
    axios.put.mockRejectedValueOnce(new Error("fail"));
    renderComponentWithRouter(<CreateCategory />);

    // Act
    await screen.findByText("SomeCat");

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByDisplayValue("SomeCat"), {
      target: { value: "UpdatedCat" },
    });
    const modal = await screen.findByRole("dialog", {
      name: /update category/i,
    });
    fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/Something went wrong/i)
      )
    );
  });

  it("deletes a category", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "TestCat" }] },
    });

    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    // After successful delete, component calls getAllCategory() again
    // Return an empty list to reflect removal
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    renderComponentWithRouter(<CreateCategory />);

    // Act
    await screen.findByText("TestCat");

    fireEvent.click(screen.getByText("Delete"));

    // Assert
    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/1"
      )
    );

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/category is deleted/i)
    );

    await waitFor(() =>
      expect(screen.queryByText("TestCat")).not.toBeInTheDocument()
    );
  });

  it("shows error toast if category delete fails", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "TestCat" }] },
    });
    axios.delete.mockRejectedValueOnce(new Error("fail"));
    renderComponentWithRouter(<CreateCategory />);
    await screen.findByText("TestCat");

    // Act
    fireEvent.click(screen.getByText("Delete"));

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/Something went wrong/i)
      )
    );
  });
});
