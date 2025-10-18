import { test as base, expect } from "@playwright/test";
import productModel from "../../../../models/productModel";
import categoryModel from "../../../../models/categoryModel";
import connectDB, { disconnectDB } from "../../../../config/db";
import { products as seedProducts } from "../../../utils/testData/products";

const test = base.extend({
  storageState: "tests/ui/.auth/admin.json",
});

test.describe("Admin Products Page", () => {
  let context;
  let _page;
  let insertedProducts = [];
  let testCategory;

  const tinyBuffer = Buffer.from("tiny");
  const testCategorySlug = "e2e-products-category";

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    _page = await context.newPage();
    await connectDB();

    // Ensure that insertion passses
    await categoryModel.deleteMany({ slug: testCategorySlug });
    testCategory = await categoryModel.create({
      name: "E2E Products Category",
      slug: testCategorySlug,
    });

    // De-conflict state, ensures idempotency
    const slugs = seedProducts.map((p) => p.slug).filter(Boolean);
    if (slugs.length) {
      await productModel.deleteMany({ slug: { $in: slugs } });
    }

    // Insertt from our seed data
    const docs = seedProducts.map((p) => ({
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      price: p.price ?? 0,
      category: testCategory._id,
      quantity: p.quantity ?? 1,
      photo: { data: tinyBuffer, contentType: "image/png" },
      shipping: p.shipping ?? true,
    }));

    insertedProducts = await productModel.insertMany(docs, { ordered: false });
  });

  test.afterAll(async () => {
    if (insertedProducts.length) {
      await productModel.deleteMany({
        _id: { $in: insertedProducts.map((p) => p._id) },
      });
    }
    if (testCategory?._id) {
      await categoryModel.deleteMany({ _id: testCategory._id });
    }
    await disconnectDB();
  });

  test("@admin-only page should list all products", async () => {
    // Arrange + Act
    await _page.goto("/dashboard/admin/products");

    // Assert - all inserted products are displayed
    for (const prod of insertedProducts) {
      await expect(_page.getByText(prod.name, { exact: true })).toBeVisible();

      await expect(
        _page.getByText(prod.description, { exact: true })
      ).toBeVisible();
    }
  });

  test("@admin-only clicking on a product card should navigate to UpdateProduct page", async () => {
    // Arrange + Act
    await _page.goto("/dashboard/admin/products");

    const firstProduct = insertedProducts[0];
    await _page.getByText(firstProduct.name, { exact: true }).click();

    // Assert - should be on UpdateProduct page
    await expect(_page).toHaveURL(
      `/dashboard/admin/product/${firstProduct.slug}`
    );
  });
});
