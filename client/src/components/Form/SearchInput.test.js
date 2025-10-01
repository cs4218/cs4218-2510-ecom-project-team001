import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";

// mock axios globally
jest.mock("axios");

// mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

let mockValues;
let mockSetValues;

jest.mock("../../context/search", () => ({
  useSearch: () => [mockValues, mockSetValues],
}));

describe("SearchInput Component", () => {
  let SearchInput;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockValues = { keyword: "" };
    mockSetValues = jest.fn((newValues) => {
      console.log("changing")
      mockValues = newValues;   // <-- keep mockValues in sync
    });
    SearchInput = require("./SearchInput").default;
  });

  //
  // Equivalence Partitioning (EP)
  //
  it("EP: should not call API when keyword is empty", async () => {
    render(<SearchInput />);
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(axios.get).not.toHaveBeenCalled();
  });

  //
  // Output-Based Testing
  //
  it("Output-based: should call setValues with the correct values", async () => {
    axios.get.mockResolvedValue({ data: ["iPhone"] });

    render(<SearchInput />);
    fireEvent.change(screen.getByPlaceholderText("Search"), {
      target: { value: "phone" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      // first call: keyword typed
      expect(mockSetValues).toHaveBeenCalledWith({ keyword: "phone" });
    });
  });


  //
  // State-Based Testing
  //
  it("State-based: should update keyword when typing", () => {
    render(<SearchInput />);
    fireEvent.change(screen.getByPlaceholderText("Search"), {
      target: { value: "laptop" },
    });
    expect(mockSetValues).toHaveBeenCalledWith({ keyword: "laptop" });
  });

  //
  // Communications-Based Testing
  //
  it("Communications-based: should call API with correct URL", async () => {
    axios.get.mockResolvedValue({ data: [] });

    render(<SearchInput />);
    fireEvent.change(screen.getByPlaceholderText("Search"), {
      target: { value: "tablet" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Search/i }));

    fireEvent.submit(screen.getByRole("search"));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/tablet");
    });
  });

  //
  // Error Handling
  //
  it("Error handling: should log error if API call fails", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValue(new Error("Network error"));

    render(<SearchInput />);
    fireEvent.change(screen.getByPlaceholderText("Search"), {
      target: { value: "camera" },
    });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });
    consoleSpy.mockRestore();
  });
});
