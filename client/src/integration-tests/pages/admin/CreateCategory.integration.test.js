import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import JWT from "jsonwebtoken";
import toast from "react-hot-toast";

import app from "../../../../../server.js";
import userModel from "../../../../../models/userModel.js";
import categoryModel from "../../../../../models/categoryModel.js";
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from "../../../../../tests/utils/db.js";

import CreateCategory from "../../../pages/admin/CreateCategory";

// Mock / Fake direct dependencies not under test
jest.mock("../../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("antd", () => ({
  Modal: ({ open, children, title, onCancel }) =>
    open ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onCancel}>Close</button>
        {children}
      </div>
    ) : null,
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("CreateCategory Page - Integration", () => {
  let server;
  let authToken;
  let port;

  // Set-up / Teardown state
  beforeAll(async () => {
    await connectToTestDb("create-category-int-tests");
  });

  afterAll(async () => {
    await disconnectFromTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    // start a real server on a random available port
    server = app.listen(7456);
    port = server.address().port;
    axios.defaults.baseURL = `http://localhost:${port}`;
    // quiet logs
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    const adminUser = await userModel.create({
      name: "BestAdmin",
      email: "admin@test.com",
      password: "password",
      phone: "12345678",
      address: "National University of Singapore",
      answer: "rainbow",
      role: 1,
    });
    authToken = JWT.sign(
      { _id: adminUser._id },
      process.env.JWT_SECRET || "test-secret"
    );
    axios.defaults.headers.common["authorization"] = authToken;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    jest.restoreAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={["/dashboard/admin/create-category"]}>
        <CreateCategory />
      </MemoryRouter>
    );

  describe("Integration with Server and Rendering", () => {
    test("loads AdminMenu and lists categories from API", async () => {
      // Arrange existing categories
      await categoryModel.insertMany([
        { name: "Electronics", slug: "electronics" },
        { name: "Clothing", slug: "clothing" },
      ]);

      // Act
      renderPage();

      // Assert - AdminMenu is present and categories fetched
      expect(await screen.findByText("Admin Panel")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Create Category" })
      ).toBeInTheDocument();

      await screen.findByText("Electronics");
      await screen.findByText("Clothing");
    });

    test("deletes a category and refreshes list", async () => {
      // Arrange
      await categoryModel.insertMany([
        { name: "Kent Ridge Books", slug: "kent-ridge-books" },
        { name: "Computing", slug: "computing" },
      ]);

      renderPage();

      // Act
      await screen.findByText("Computing");

      const allRows = screen.getAllByRole("row");
      const computingRow = allRows.find((r) =>
        within(r).queryByText("Computing")
      );
      fireEvent.click(
        within(computingRow).getByRole("button", { name: /delete/i })
      );

      // Assert
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("category is deleted")
      );
      await waitFor(() =>
        expect(screen.queryByText("Computing")).not.toBeInTheDocument()
      );
      await screen.findByText("Kent Ridge Books");
    });
  });

  describe("Integration with CategoryForm component", () => {
    test("creates a new category via CategoryForm and refreshes list", async () => {
      // Arrange
      renderPage();

      // Act
      const input = await screen.findByPlaceholderText(
        /Enter new category \(max length=50\)/i
      );
      fireEvent.change(input, { target: { value: "DogTreats" } });

      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("DogTreats is created")
      );
      await screen.findByText("DogTreats");
    });

    test("updates an existing category using modal CategoryForm", async () => {
      // Arrange
      await categoryModel.create({
        name: "Octobox Snacks",
        slug: "octobox-snacks",
      });

      renderPage();

      await screen.findByText("Octobox Snacks");

      // Act - edit the category
      const rows = screen.getAllByRole("row");
      const targetRow = rows.find((r) =>
        within(r).queryByText("Octobox Snacks")
      );
      fireEvent.click(within(targetRow).getByRole("button", { name: /edit/i }));

      const modal = await screen.findByTestId("modal");
      const modalInput = within(modal).getByPlaceholderText(
        /Enter new category \(max length=50\)/i
      );
      fireEvent.change(modalInput, { target: { value: "Cheers Snacks" } });

      // Submit update form within modal
      fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));

      // Assert
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Cheers Snacks is updated")
      );
      await screen.findByText("Cheers Snacks");
    });
  });
});
