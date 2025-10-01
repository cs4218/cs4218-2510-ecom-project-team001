import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";

import SearchInput from "./SearchInput";


// chatgpt is used to aid in the creation of test cases
// mock axios
jest.mock("axios");

// mock react-router navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// mock context
let mockValues;
let mockSetValues;
jest.mock("../../context/search", () => ({
  useSearch: () => [mockValues, mockSetValues],
}));

describe("SearchInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValues = { keyword: "", results: [] };
    mockSetValues = jest.fn((newValues) => {
      mockValues = newValues;
    });
  });

  it("calls setValues when input is changed", () => {
    render(<SearchInput />);
    fireEvent.change(screen.getByPlaceholderText(/Search/i), {
      target: { value: "Laptop" },
    });

    expect(mockSetValues).toHaveBeenCalledWith({
      keyword: "Laptop",
      results: [],
    });
  });

  it("submits the form and triggers axios + navigate", async () => {
    axios.get.mockResolvedValue({ data: ["result1"] });
    mockValues = { keyword: "phone", results: [] };

    render(<SearchInput />);

    // inline role query in fireEvent
    fireEvent.click(screen.getByRole("button", { name: /Search/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/phone");
      expect(mockSetValues).toHaveBeenCalledWith({
        keyword: "phone",
        results: ["result1"],
      });
      expect(mockNavigate).toHaveBeenCalledWith("/search");
    });
  });

  it("handles API error gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    axios.get.mockRejectedValue(new Error("Network Error"));
    mockValues = { keyword: "tablet", results: [] };

    render(<SearchInput />);

    fireEvent.click(screen.getByRole("button", { name: /Search/i }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
