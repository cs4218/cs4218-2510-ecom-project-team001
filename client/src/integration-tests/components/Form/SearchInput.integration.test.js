import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import slugify from "slugify";

import app from "../../../../../server.js";
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from "../../../../../tests/utils/db.js";
import categoryModel from "../../../../../models/categoryModel.js";
import productModel from "../../../../../models/productModel.js";
import SearchInput from "../../../components/Form/SearchInput";
import { SearchProvider } from "../../../context/search";

/*
chatgpt is used to aid in creation of the test cases below

=====================================================
Integration testing involving
1. components/Form/SearchInput.js
2. context/search.js,
3. pages/Search.js components
=====================================================

*/


// ============================
// Mock Search Results Page that reads from context and displays actual results
// ============================
const MockSearchPage = () => {
  const { useSearch } = require("../../../context/search");
  const [values] = useSearch();
  return (
    <div data-testid="search-results-page">
      <h2>Search Results</h2>
      {values.results.length > 0 ? (
        <ul data-testid="results-list">
          {values.results.map((item) => (
            <li key={item._id} data-testid="search-item">
              {item.name}
            </li>
          ))}
        </ul>
      ) : (
        <p data-testid="no-results">No Results Found</p>
      )}
    </div>
  );
};

// Register the mock before any imports use it
jest.mock("../../../pages/Search", () => ({
  __esModule: true,
  default: MockSearchPage,
}));

// ============================
// Integration Tests
// ============================
describe("SearchInput Component - UI + Backend Integration", () => {
  let server;
  let baseURL;
  let gadgetCategory;

  beforeAll(async () => {
    await connectToTestDb("searchinput-ui-int-final");
  });

  afterAll(async () => {
    await disconnectFromTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    cleanup();
    jest.restoreAllMocks();

    // Start backend server on a random available port
    server = app.listen(7493);
    baseURL = `http://localhost:${server.address().port}`;
    axios.defaults.baseURL = baseURL;

    // Seed test data
    gadgetCategory = await categoryModel.create({
      name: "Gadgets",
      slug: "gadgets",
    });

    await productModel.insertMany([
      {
        name: "Wireless Mouse",
        slug: slugify("Wireless Mouse"),
        description: "Smooth and fast mouse for productivity",
        price: 39,
        category: gadgetCategory._id,
        quantity: 10,
        shipping: true,
      },
      {
        name: "Gaming Mousepad",
        slug: slugify("Gaming Mousepad"),
        description: "High precision surface for mouse tracking",
        price: 15,
        category: gadgetCategory._id,
        quantity: 20,
        shipping: true,
      },
      {
        name: "Mechanical Keyboard",
        slug: slugify("Mechanical Keyboard"),
        description: "Tactile switches for better typing experience",
        price: 99,
        category: gadgetCategory._id,
        quantity: 8,
        shipping: false,
      },
    ]);
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  // Helper to render component with router + context
  const renderWithRouter = () =>
    render(
      <MemoryRouter initialEntries={["/"]}>
        <SearchProvider>
          <Routes>
            <Route path="/" element={<SearchInput />} />
            <Route path="/search" element={<MockSearchPage />} />
          </Routes>
        </SearchProvider>
      </MemoryRouter>
    );

  // ============================
  // TEST CASES
  // ============================

  test("renders input and performs search (multiple results visible)", async () => {
    renderWithRouter();

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "mouse" } });
    fireEvent.submit(screen.getByRole("search"));

    // Wait for results page UI
    const resultsPage = await screen.findByTestId("search-results-page");
    expect(resultsPage).toBeInTheDocument();

    // Verify list shows both items
    const items = await screen.findAllByTestId("search-item");
    const names = items.map((el) => el.textContent);
    expect(names).toEqual(
      expect.arrayContaining(["Wireless Mouse", "Gaming Mousepad"])
    );
  });

  test("renders input and performs search (single result visible)", async () => {
    renderWithRouter();

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "keyboard" } });
    fireEvent.submit(screen.getByRole("search"));

    // Wait for results page UI
    const resultsPage = await screen.findByTestId("search-results-page");
    expect(resultsPage).toBeInTheDocument();

    // Only 1 result should be rendered
    const items = await screen.findAllByTestId("search-item");
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent("Mechanical Keyboard");
  });

  test("shows 'No Results Found' UI when no matches", async () => {
    renderWithRouter();

    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "camera" } });
    fireEvent.submit(screen.getByRole("search"));

    await screen.findByTestId("search-results-page");
    const noResults = await screen.findByTestId("no-results");
    expect(noResults).toHaveTextContent("No Results Found");
  });

  test("handles backend error gracefully and keeps search bar rendered", async () => {
    const spy = jest
      .spyOn(axios, "get")
      .mockRejectedValueOnce(new Error("Network error"));

    renderWithRouter();
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "errorcase" } });
    fireEvent.submit(screen.getByRole("search"));

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();

    spy.mockRestore();
  });
});
