import React from "react";
import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import JWT from "jsonwebtoken";

import app from "../../../../../server.js";
import userModel from "../../../../../models/userModel.js";
import categoryModel from "../../../../../models/categoryModel.js";
import productModel from "../../../../../models/productModel.js";
import orderModel from "../../../../../models/orderModel.js";
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from "../../../../../tests/utils/db.js";

import Orders from "../../../pages/user/Orders";

jest.mock("../../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../../components/UserMenu", () => () => (
  <div data-testid="user-menu">UserMenuMock</div>
));

jest.mock("../../../context/auth", () => ({
  useAuth: jest.fn(() => [
    { token: "fake-jwt-token", user: { name: "TestUser" } },
    jest.fn(),
  ]),
}));

describe("Orders Page - Integration", () => {
  let server;
  let port;
  let user;

  beforeAll(async () => {
    await connectToTestDb("orders-int-tests");
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
    server = app.listen(7461);
    port = server.address().port;
    axios.defaults.baseURL = `http://localhost:${port}`;

    user = await userModel.create({
      name: "TestUser",
      email: "user@test.com",
      password: "password",
      phone: "98765432",
      address: "NUS SoC",
      answer: "sky",
      role: 0,
    });

    const token = JWT.sign(
      { _id: user._id },
      process.env.JWT_SECRET || "test-secret"
    );
    axios.defaults.headers.common["authorization"] = token;
  });

  afterEach(async () => {
    await new Promise((resolve) => server.close(resolve));
    jest.clearAllMocks();
  });

  const renderOrders = () =>
    render(
      <MemoryRouter initialEntries={["/dashboard/user/orders"]}>
        <Routes>
          <Route path="/dashboard/user/orders" element={<Orders />} />
        </Routes>
      </MemoryRouter>
    );

  describe("Basic Rendering", () => {
    test("renders layout and user menu correctly", async () => {
      renderOrders();
      expect(await screen.findByTestId("layout")).toBeInTheDocument();
      expect(await screen.findByTestId("user-menu")).toBeInTheDocument();
      expect(
        await screen.findByRole("heading", { name: /All Orders/i })
      ).toBeInTheDocument();
    });

    test("renders gracefully with no orders", async () => {
      renderOrders();
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /All Orders/i })
        ).toBeInTheDocument();
      });
      expect(screen.queryByLabelText("user-order")).not.toBeInTheDocument();
    }),10;
  });

  describe("Orders Integration with API", () => {
    test("displays a user's orders with product details", async () => {
      const testCategory = await categoryModel.create({
        name: "TestCategory",
        slug: "test-category",
      });

      const p1 = await productModel.create({
        name: "AI Pencil",
        description: "Smart stylus for students",
        price: 35,
        category: testCategory._id,
        quantity: 5,
        slug: "ai-pencil",
      });

      const p2 = await productModel.create({
        name: "Vision Glasses",
        description: "AR-enabled learning glasses",
        price: 200,
        category: testCategory._id,
        quantity: 2,
        slug: "vision-glasses",
      });

      await orderModel.create({
        products: [p1._id, p2._id],
        payment: { success: true },
        buyer: user._id,
        status: "Processing",
        createdAt: new Date(),
      });

      renderOrders();

      const orderContainers = await screen.findAllByLabelText("user-order");
      expect(orderContainers).toHaveLength(1);

      const table = within(orderContainers[0]).getByRole("table");
      expect(within(table).getByText("Processing")).toBeInTheDocument();
      expect(within(table).getByText("TestUser")).toBeInTheDocument();
      expect(within(table).getByText("Success")).toBeInTheDocument();
      expect(within(table).getByText("2")).toBeInTheDocument();

      const productImgs = within(orderContainers[0]).getAllByRole("img");
      expect(productImgs).toHaveLength(2);
      expect(screen.getByText("AI Pencil")).toBeInTheDocument();
      expect(screen.getByText("Vision Glasses")).toBeInTheDocument();
    });

    test("renders multiple orders for the same user", async () => {
      const testCategory = await categoryModel.create({
        name: "BulkCategory",
        slug: "bulk-category",
      });

      const prodA = await productModel.create({
        name: "Notebook",
        description: "Plain notebook",
        price: 5,
        category: testCategory._id,
        quantity: 50,
        slug: "notebook",
      });

      const prodB = await productModel.create({
        name: "Mechanical Keyboard",
        description: "RGB keyboard",
        price: 120,
        category: testCategory._id,
        quantity: 10,
        slug: "keyboard",
      });

      const prodC = await productModel.create({
        name: "Headphones",
        description: "Noise cancelling",
        price: 80,
        category: testCategory._id,
        quantity: 7,
        slug: "headphones",
      });

      await orderModel.create({
        products: [prodA._id, prodB._id],
        payment: { success: true },
        buyer: user._id,
        status: "Shipped",
        createdAt: new Date(),
      });

      await orderModel.create({
        products: [prodC._id],
        payment: { success: false },
        buyer: user._id,
        status: "cancel",
        createdAt: new Date(),
      });

      renderOrders();

      const orderContainers = await screen.findAllByLabelText("user-order");
      expect(orderContainers.length).toBe(2);

      const firstOrder = within(orderContainers[0]).getByRole("table");
      const secondOrder = within(orderContainers[1]).getByRole("table");

      expect(within(firstOrder).getByText("Shipped")).toBeInTheDocument();
      expect(within(firstOrder).getByText("Success")).toBeInTheDocument();
      expect(within(secondOrder).getByText("cancel")).toBeInTheDocument();
      expect(within(secondOrder).getByText("Failed")).toBeInTheDocument();

      expect(screen.getByText("Notebook")).toBeInTheDocument();
      expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
      expect(screen.getByText("Headphones")).toBeInTheDocument();
    });
  });
});
