import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import JWT from "jsonwebtoken";
import toast from "react-hot-toast";

import app from "../../../../../server.js";
import userModel from "../../../../../models/userModel.js";
import categoryModel from "../../../../../models/categoryModel.js";
import productModel from "../../../../../models/productModel.js";
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from "../../../../../tests/utils/db.js";

import UpdateProduct from "../../../pages/admin/UpdateProduct";

jest.mock("../../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("antd", () => {
  const Select = ({
    children,
    onChange,
    className,
    placeholder,
    value,
    ...rest
  }) => (
    <select
      className={className}
      onChange={(e) => onChange && onChange(e.target.value)}
      value={value}
      {...rest}
    >
      {children}
    </select>
  );
  Select.Option = ({ children, value, ...rest }) => (
    <option value={value} {...rest}>
      {children}
    </option>
  );
  return { Select };
});

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("UpdateProduct Page - Integration", () => {
  jest.setTimeout(2500);
  let server;
  let authToken;
  let port;
  let catA;
  let catB;
  let product;

  // Set-up / Teardown state
  beforeAll(async () => {
    await connectToTestDb("update-product-int-tests");
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(async () => {
    console.error.mockRestore();
    console.log.mockRestore();
    await disconnectFromTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
    server = app.listen(7458);
    port = server.address().port;
    axios.defaults.baseURL = `http://localhost:${port}`;

    // Test admin
    const admin = await userModel.create({
      name: "BestestAdmin",
      email: "bestadmin@test.com",
      password: "password",
      phone: "12345678",
      address: "NUS",
      answer: "rainbow",
      role: 1,
    });
    authToken = JWT.sign(
      { _id: admin._id },
      process.env.JWT_SECRET || "test-secret"
    );
    axios.defaults.headers.common["authorization"] = authToken;

    // Test categories
    [catA, catB] = await categoryModel.insertMany([
      { name: "Stationery", slug: "stationery" },
      { name: "Snacks", slug: "snacks" },
    ]);

    // Test product
    product = await productModel.create({
      name: "Otto",
      slug: "otto",
      description: "Relatable phone case",
      price: 9.9,
      category: catA._id,
      quantity: 50,
      shipping: true,
    });

    // URL.createObjectURL stub for image preview
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = jest.fn(() => "blob:mock");
    }
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));

    jest.clearAllMocks();
  });

  const renderWithRoute = (slug) =>
    render(
      <MemoryRouter initialEntries={[`/dashboard/admin/product/${slug}`]}>
        <Routes>
          <Route
            path="/dashboard/admin/product/:slug"
            element={<UpdateProduct />}
          />
        </Routes>
      </MemoryRouter>
    );

  describe("Integration with Server and Rendering", () => {
    test("prefills product form and shows selected category/shipping", async () => {
      // Act
      renderWithRoute(product.slug);

      // Assert - AdminMenu present
      expect(await screen.findByText("Admin Panel")).toBeInTheDocument();

      // Assert - Prefilled inputs (wait for full state load)
      const nameInput = await screen.findByPlaceholderText(/write a name/i);
      await waitFor(() => expect(nameInput).toHaveValue("Otto"));
      await waitFor(() =>
        expect(screen.getByPlaceholderText(/write a description/i)).toHaveValue(
          "Relatable phone case"
        )
      );
      await waitFor(() =>
        expect(screen.getByPlaceholderText(/write a price/i)).toHaveValue(9.9)
      );
      await waitFor(() =>
        expect(screen.getByPlaceholderText(/write a quantity/i)).toHaveValue(50)
      );

      await screen.findByRole("option", { name: "Stationery" });
      await screen.findByRole("option", { name: "Snacks" });
      const categorySelect = screen.getByTestId("category-select");
      await waitFor(() =>
        expect(categorySelect).toHaveValue(catA._id.toString())
      );

      const shippingSelect = screen.getByTestId("shipping-select");
      await waitFor(() => expect(shippingSelect).toHaveValue("1"));
    });
  });

  describe("Update and Delete flows", () => {
    test("updates a product with new fields, category and shipping", async () => {
      // Arrange
      renderWithRoute(product.slug);
      const initialName = await screen.findByPlaceholderText(/write a name/i);
      // ensure id and rest are loaded to avoid 404 on update
      await waitFor(() => expect(initialName).toHaveValue("Otto"));
      await waitFor(() =>
        expect(screen.getByTestId("category-select")).toHaveValue(
          catA._id.toString()
        )
      );
      await waitFor(() =>
        expect(screen.getByTestId("shipping-select")).toHaveValue("1")
      );

      // Act - change fields
      fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
        target: { value: "iPhone case" },
      });
      fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
        target: { value: "Otto iPhone case" },
      });
      fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
        target: { value: "4.5" },
      });
      fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
        target: { value: "120" },
      });

      // Change category to catB and shipping to "0"
      const [catSelect, shipSelect] = screen.getAllByRole("combobox");
      fireEvent.change(catSelect, {
        target: { value: catB._id.toString() },
      });
      fireEvent.change(shipSelect, { target: { value: "0" } });

      // Do photo upload
      const file = new File([Buffer.from("bytes")], "case-update.png", {
        type: "image/png",
      });
      const fileInput = screen.getByLabelText(/upload photo/i);
      Object.defineProperty(fileInput, "files", {
        value: [file],
        configurable: true,
      });
      fireEvent.change(fileInput);

      // Submit update
      fireEvent.click(screen.getByRole("button", { name: /update product/i }));

      // Assert - success toast and persist DB state
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          "Product Updated Successfully"
        )
      );
      const updated = await productModel.findById(product._id);
      expect(updated.name).toBe("iPhone case");
      expect(updated.description).toBe("Otto iPhone case");
      expect(updated.price).toBe(4.5);
      expect(updated.quantity).toBe(120);
      expect(updated.category.toString()).toBe(catB._id.toString());
      expect(updated.shipping).toBe(false);
    });

    test("deletes a product after confirmation", async () => {
      // Arrange
      renderWithRoute(product.slug);
      await screen.findByText("Update Product");

      const loadedName = await screen.findByPlaceholderText(/write a name/i);
      await waitFor(() => expect(loadedName).toHaveValue("Otto"));
      const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("yes");

      // Act
      fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

      // Assert
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          "Product Deleted Successfully"
        )
      );
      const gone = await productModel.findById(product._id);
      expect(gone).toBeNull();

      promptSpy.mockRestore();
    });
  });
});
