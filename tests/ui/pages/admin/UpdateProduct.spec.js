import { expect, test as base } from "@playwright/test";
import fs from "fs";
import path from "path";
import productModel from "../../../../models/productModel";
import categoryModel from "../../../../models/categoryModel";
import connectDB, { disconnectDB } from "../../../../config/db.js";

const test = base.extend({
  storageState: "tests/ui/.auth/admin.json",
});

test.describe("Update Product Page", () => {
  let context;
  let page;
  let testProduct;
  let testCategory;

  const productImage = fs.readFileSync(
    path.resolve(process.cwd(), "tests/fixtures/test-product.png")
  );

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    await connectDB();
    await categoryModel.deleteMany({ slug: "electronics-test" });
    testCategory = await categoryModel.create({
      name: "Electronics Test",
      slug: "electronics-test",
    });
  });

  test.beforeEach(async () => {
    await productModel.deleteMany({ slug: "Tablet" });
    testProduct = await productModel.create({
      name: "Tablet",
      slug: "Tablet",
      description: "A lightweight tablet",
      price: 700,
      category: testCategory._id,
      quantity: 2,
      photo: {
        data: productImage,
        contentType: "image/png",
      },
      shipping: true,
    });
  });

  test.afterAll(async () => {
    // Clean up - delete the product created so it doesn't affect future tests
    await productModel.deleteMany({ _id: testProduct._id });
    await categoryModel.deleteMany({ _id: testCategory._id });
    await disconnectDB();
  });

  test("@admin-only page should render all fields pre-filled", async () => {
    // Arrange + Act
    await page.goto(`/dashboard/admin/product/${testProduct.slug}`);

    await expect(
      page.getByRole("textbox", { name: "write a name" })
    ).toHaveValue("Tablet");

    // Assert - all fields pre-filled
    await expect(page.getByTestId("category-select")).toContainText(
      "Electronics Test"
    );
    await expect(
      page.getByRole("img", { name: "product_photo" })
    ).toBeVisible();

    await expect(page.getByPlaceholder("write a description")).toContainText(
      "A lightweight tablet"
    );

    await expect(page.getByPlaceholder("write a Price")).toHaveValue("700");

    await expect(page.getByPlaceholder("write a quantity")).toHaveValue("2");

    await expect(
      page.getByTestId("shipping-select").getByTestId("select-yes-option-label")
    ).toContainText("Yes");
  });

  test("@admin-only should allow me to update a product", async () => {
    // Arrange
    await page.goto(`/dashboard/admin/product/${testProduct.slug}`);
    await expect(
      page.getByRole("textbox", { name: "write a name" })
    ).toHaveValue("Tablet");

    // Act - update fields
    await page.getByRole("textbox", { name: "write a description" }).click();
    await page.getByTestId("description-input").fill("Tablet Updated");

    await page.getByPlaceholder("write a Price").click();
    await page.getByPlaceholder("write a Price").fill("30");

    await page.getByPlaceholder("write a quantity").click();
    await page.getByPlaceholder("write a quantity").fill("30");

    await page.locator(".mb-3 > .ant-select").click();
    await page.getByText("No").click();

    await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();

    // Assert - success toast shows up
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Product Updated Successfully$/ })
        .nth(2)
    ).toBeVisible();

    await page.waitForURL(`/dashboard/admin/products`);

    // Assert - persisted on the UI
    await page.goto(`/dashboard/admin/product/${testProduct.slug}`);
    await expect(page.getByTestId("name-input")).toHaveValue("Tablet");
    await expect(page.getByTestId("description-input")).toContainText(
      "Tablet Updated"
    );
    await expect(page.getByPlaceholder("write a Price")).toHaveValue("30");
    await expect(page.getByPlaceholder("write a quantity")).toHaveValue("30");
    await expect(
      page.getByTestId("shipping-select").getByTestId("select-no-option-label")
    ).toContainText("No");
  });

  test("@admin-only should not allow me to update a product when product name field not filled in", async () => {
    // Arrange
    await page.goto(`/dashboard/admin/product/${testProduct.slug}`);
    await expect(
      page.getByRole("textbox", { name: "write a name" })
    ).toHaveValue("Tablet");

    // Act - clear the name field so validation fails on name
    await page.getByTestId("name-input").fill("");
    await page.getByRole("button", { name: "UPDATE PRODUCT" }).click();

    // Assert - Error toast shows up for missing name
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^something went wrong$/ })
        .nth(2)
    ).toBeVisible();
  });

  test("@admin-only should allow me to delete a product after confirmation with non-empty input", async () => {
    // Arrange
    await page.goto(`/dashboard/admin/product/${testProduct.slug}`);

    await expect(
      page.getByRole("textbox", { name: "write a name" })
    ).toHaveValue("Tablet");

    // Prepare to accept the prompt with a non-empty value
    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("prompt");
      await dialog.accept("yes");
    });

    // Act - click delete and confirm
    await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

    // Assert - success toast shows up
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Product Deleted Successfully$/ })
        .nth(2)
    ).toBeVisible();

    // Assert - navigated to products page
    await expect(page).toHaveURL(/\/dashboard\/admin\/products/);

    // Assert - product removed from DB (non-brittle approach)
    const gone = await productModel.findById(testProduct._id);
    expect(gone).toBeNull();
  });

  test("@admin-only should not allow me to delete a product after confirmation with empty input", async () => {
    // Arrange
    await page.goto(`/dashboard/admin/product/${testProduct.slug}`);

    await expect(
      page.getByRole("textbox", { name: "write a name" })
    ).toHaveValue("Tablet");

    // Prepare to accept the prompt with a non-empty value
    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("prompt");
      await dialog.accept("");
    });

    // Act - click delete and confirm
    await page.getByRole("button", { name: "DELETE PRODUCT" }).click();

    // Assert - product has not been removed
    const present = await productModel.findById(testProduct._id);
    expect(present).not.toBeNull();
  });
});
