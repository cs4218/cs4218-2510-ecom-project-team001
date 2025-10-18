import { test as base, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import connectDB, { disconnectDB } from "../../../../config/db.js";
import userModel from "../../../../models/userModel";
import categoryModel from "../../../../models/categoryModel";
import productModel from "../../../../models/productModel";
import orderModel from "../../../../models/orderModel";
import { productsForOrders } from "../../../utils/testData/products";

const test = base.extend({
  storageState: "tests/ui/.auth/admin.json",
});

test.describe("Admin Orders Page", () => {
  let context;
  let page;
  let buyers = [];
  let categories = [];
  let insertedProducts = [];
  let insertedOrders = [];

  const productImage = fs.readFileSync(
    path.resolve(process.cwd(), "tests/fixtures/test-product.png")
  );
  const catSlugs = ["e2e-gadgets", "e2e-travel"];

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    await connectDB();

    await categoryModel.deleteMany({ slug: { $in: catSlugs } });
    categories = await categoryModel.insertMany([
      { name: "E2E Gadgets", slug: catSlugs[0] },
      { name: "E2E Travel", slug: catSlugs[1] },
    ]);

    const slugs = productsForOrders.map((p) => p.slug).filter(Boolean);
    if (slugs.length) {
      await productModel.deleteMany({ slug: { $in: slugs } });
    }

    const prodDocs = productsForOrders.map((p, idx) => ({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      price: p.price ?? 0,
      category: idx < 3 ? categories[0]._id : categories[1]._id,
      quantity: p.quantity ?? 1,
      photo: { data: productImage, contentType: "image/png" },
      shipping: p.shipping ?? true,
    }));
    insertedProducts = await productModel.insertMany(prodDocs, {
      ordered: false,
    });

    // Seed two buyers
    const buyerDocs = [
      {
        name: "Cheng Hou",
        email: "buyer1@nus.nus.nus",
        password: "password",
        phone: "81117533",
        address: "NUS",
        answer: "rainbow",
        role: 0,
      },
      {
        name: "Aaron",
        email: "buyer2@nus.nus.nus",
        password: "password",
        phone: "84242242",
        address: "NUS",
        answer: "rainbow",
        role: 0,
      },
    ];

    await userModel.deleteMany({
      email: { $in: buyerDocs.map((b) => b.email) },
    });
    buyers = await userModel.insertMany(buyerDocs);

    // Create two orders with three products each
    insertedOrders = await orderModel.insertMany([
      {
        products: insertedProducts.map((p) => p._id),
        payment: { success: true, method: "card" },
        buyer: buyers[0]._id,
        status: "Not Process",
      },
      {
        products: insertedProducts.map((p) => p._id),
        payment: { success: true, method: "card" },
        buyer: buyers[1]._id,
        status: "Processing",
      },
    ]);
  });

  test.afterAll(async () => {
    // Clean up
    if (insertedOrders.length) {
      await orderModel.deleteMany({
        _id: { $in: insertedOrders.map((o) => o._id) },
      });
    }
    if (insertedProducts.length) {
      await productModel.deleteMany({
        _id: { $in: insertedProducts.map((p) => p._id) },
      });
    }
    if (buyers.length) {
      await userModel.deleteMany({ _id: { $in: buyers.map((b) => b._id) } });
    }
    if (categories.length) {
      await categoryModel.deleteMany({
        _id: { $in: categories.map((c) => c._id) },
      });
    }
    await disconnectDB();
  });

  test("@admin-only page should render orders and their products", async () => {
    // Arramge - pg loads
    await page.goto("/dashboard/admin/orders");

    await expect(
      page.getByRole("heading", { name: "All Orders" })
    ).toBeVisible();

    // Assert
    // Two orders should be present; quantity cell shows 3 for each
    const qtyCells = page.getByRole("cell", { name: /^\s*3\s*$/ });
    await expect.poll(() => qtyCells.count()).toBeGreaterThanOrEqual(2);

    // Check a few product names appear
    await expect(
      page.getByText(productsForOrders[0].name, { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText(productsForOrders[3].name, { exact: true }).first()
    ).toBeVisible();

    await expect(page.getByText("Cheng Hou", { exact: true })).toBeVisible();
    await expect(page.getByText("Aaron", { exact: true })).toBeVisible();
  });

  test("@admin-only should allow me to update an order status", async () => {
    // Arrange + Act
    await page.goto("/dashboard/admin/orders");
    await expect(
      page.getByRole("heading", { name: "All Orders" })
    ).toBeVisible();

    // Act
    const selects = page.locator(".ant-select");
    await selects.first().click();
    await page.getByText("Delivered", { exact: true }).click();

    // Assert - toast behavior
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Status Updated Successfully$/ })
        .nth(2)
    ).toBeVisible();

    // Assert - persistence
    const existing = await orderModel.find({}).sort({ createdAt: -1 });
    const updated = await orderModel.findById(existing[0]._id);
    expect(updated.status).toBe("Delivered");
  });
});
