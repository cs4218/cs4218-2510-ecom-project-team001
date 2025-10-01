import React from "react";
import { render, screen } from "@testing-library/react";
import { useSearch } from "../context/search";
import Search from "./Search";


// chatgpt is used to aid in creation of test cases
let mockValues;
jest.mock("../context/search", () => ({
  useSearch: () => [mockValues, jest.fn()],
}));


jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

describe("Search Component (EP, Output-based, BVA)", () => {
  beforeEach(() => {
    mockValues = { results: [] };
  });

  //
  // Equivalence Partitioning (EP)
  //
  it("EP: shows 'No Products Found' when results = [] (empty partition)", () => {
    mockValues = { results: [] };
    render(<Search />);
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  it("EP: shows 'Found X' when results > 0 (non-empty partition)", () => {
    mockValues = {
      results: [{ _id: "1", name: "Phone", description: "Smartphone", price: 500 }],
    };
    render(<Search />);
    expect(screen.getByText("Found 1")).toBeInTheDocument();
  });

  //
  // Output-Based Testing
  //
  it("Output-based: renders details correctly for a single result", () => {
    mockValues = {
      results: [
        { _id: "1", name: "OneItem", description: "This is item one", price: 10 },
      ],
    };
    render(<Search />);
    expect(screen.getByText("Found 1")).toBeInTheDocument();
    expect(screen.getByText("OneItem")).toBeInTheDocument();
    expect(screen.getByText(/\$ 10/)).toBeInTheDocument();
  });

  it("Output-based: renders details correctly for multiple results", () => {
    mockValues = {
      results: [
        { _id: "1", name: "ItemA", description: "Desc A", price: 100 },
        { _id: "2", name: "ItemB", description: "Desc B", price: 200 },
      ],
    };
    render(<Search />);
    expect(screen.getByText("Found 2")).toBeInTheDocument();
    expect(screen.getByText("ItemA")).toBeInTheDocument();
    expect(screen.getByText("ItemB")).toBeInTheDocument();
  });

  //
  // Boundary Value Analysis (BVA)
  //
  it("BVA: should truncate description to 30 chars + ellipsis when longer", () => {
    const longDesc = "x".repeat(50); // 50 chars
    mockValues = {
      results: [{ _id: "3", name: "LongDescItem", description: longDesc, price: 300 }],
    };
    render(<Search />);
    // should display only first 30 chars followed by "..."
    expect(screen.getByText(`${"x".repeat(30)}...`)).toBeInTheDocument();
  });

  it("BVA: should show full description + ellipsis when <= 30 chars", () => {
    const shortDesc = "short description"; // < 30 chars
    mockValues = {
      results: [{ _id: "4", name: "ShortDescItem", description: shortDesc, price: 50 }],
    };
    render(<Search />);
    // should display full string with "..."
    expect(screen.getByText(`${shortDesc}...`)).toBeInTheDocument();
  });
});
