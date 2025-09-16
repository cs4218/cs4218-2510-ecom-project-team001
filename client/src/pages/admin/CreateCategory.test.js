import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateCategory from "../CreateCategory";
import axios from "axios";
import toast from "react-hot-toast";

// Mock dependencies
jest.mock("axios");
jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe("CreateCategory", () => {
  beforeEach(() => {
    // Self-note: Clears call history, but does not reset implementation from mockImplementation,
    // or mockReturnValue etc.
    jest.clearAllMocks();
  });

  it("fetches and displays categories on render", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "TestCat" }] },
    });
    render(<CreateCategory />);
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    await screen.findByText("TestCat");
  });

  // Have 2 test specifications for separate error toasts test error test requirements/cases
  it("shows error toast if fetching categories fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("fail"));
    render(<CreateCategory />);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("getting catgeory")
      )
    );
  });

  it("shows error toast if response indicate failure", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: false, message: "fail" },
    });
    render(<CreateCategory />);
    await waitFor(() => expect(toast.error).toHaveBeenCalled(1));
  });

  it("creates a category on form submit", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    render(<CreateCategory />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "SomeCat" },
    });
    fireEvent.click(screen.getByText(/Submit/i));
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/category/create-category",
        { name: "SomeCat" }
      )
    );
    expect(toast.success).toHaveBeenCalledWith("NewCat is created");
  });

  it("shows error toast if category creation fails", async () => {
    axios.post.mockRejectedValueOnce(new Error("fail"));
    render(<CreateCategory />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "NewCat" },
    });
    fireEvent.click(screen.getByText("Submit"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining(/something went wrong/i)
      )
    );
  });

  it("clears form on form submit success", async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
    render(<CreateCategory />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, {
      target: { value: "SomeCat" },
    });
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

    // Act
    render(<CreateCategory />);
    await screen.findByText("SomeCat");

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByDisplayValue("SomeCat"), {
      target: { value: "UpdatedCat" },
    });
    fireEvent.click(screen.getByText("Submit"));

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
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "SomeCat" }] },
    });
    axios.put.mockRejectedValueOnce(new Error("fail"));
    render(<CreateCategory />);
    await screen.findByText("SomeCat");

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByDisplayValue("SomeCat"), {
      target: { value: "UpdatedCat" },
    });
    fireEvent.click(screen.getByText("Submit"));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        // Self-note: Typo in original message "Somtihing"
        expect.stringContaining(/Something went wrong/i)
      )
    );
  });

  it("deletes a category", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "TestCat" }] },
    });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    render(<CreateCategory />);
    await screen.findByText("TestCat");

    // Act
    fireEvent.click(screen.getByText("Delete"));

    // Assert
    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith(
        "/api/v1/category/delete-category/1"
      )
    );

    expect(toast.success).toHaveBeenCalledWith(/category is deleted/i);

    expect(screen.queryByText("TestCat")).not.toBeInTheDocument();
  });

  it("shows error toast if category delete fails", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [{ _id: "1", name: "TestCat" }] },
    });
    axios.delete.mockRejectedValueOnce(new Error("fail"));
    render(<CreateCategory />);
    await screen.findByText("TestCat");

    // Act
    fireEvent.click(screen.getByText("Delete"));

    // Assert
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining(/Something went wrong/i)
      )
    );
  });
});
