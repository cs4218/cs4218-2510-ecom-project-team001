import { test as base, expect } from "@playwright/test";
import productModel from "../../../../models/productModel";
import connectDB, { disconnectDB } from "../../../../config/db";

// For normal user
const test = base.extend({
  storageState: "tests/ui/.auth/admin.json",
});

// Run tests in parallel to speed up execution
test.describe.configure({ mode: "parallel" });

test.describe("Create Product Page", () => {
  let context;
  let _page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    _page = await context.newPage();
    await connectDB();
  });

  test.afterEach(async () => {
    // Clean up - delete the product created so it doesn't affect future tests
    await productModel.deleteMany({ name: "Nature Book" });
  });

  test.afterAll(async () => {
    await disconnectDB();
  });

  test("@admin-only should allow me to create a product when all fields filled in", async ({
    page,
  }) => {
    // Arrange + Act
    await page.goto("/dashboard/admin/create-product");

    // Fill in the form and assert that form values are updated correctly
    await page
      .locator("div")
      .filter({ hasText: /^Select a category$/ })
      .first()
      .click();
    await page.getByTitle("Book").locator("div").click();
    await expect(page.getByRole("main")).toContainText("Book");

    await page.getByText("Upload Photo").click();
    await page
      .getByLabel("Upload Photo")
      .setInputFiles("tests/fixtures/test-photo.jpg");
    // Preview shows up
    await expect(
      page.getByRole("img", { name: "product_photo" })
    ).toBeVisible();

    await page.getByRole("textbox", { name: "write a name" }).click();
    await page
      .getByRole("textbox", { name: "write a name" })
      .fill("Nature Book");

    await page.getByRole("textbox", { name: "write a description" }).click();
    await page
      .getByRole("textbox", { name: "write a description" })
      .fill("Book on Nature");
    await expect(page.getByPlaceholder("write a description")).toContainText(
      "Book on Nature"
    );

    await page.getByPlaceholder("write a Price").click();
    await page.getByPlaceholder("write a Price").fill("20");
    await expect(page.getByPlaceholder("write a Price")).toHaveValue("20");

    await page.getByPlaceholder("write a quantity").click();
    await page.getByPlaceholder("write a quantity").fill("20");
    await expect(page.getByPlaceholder("write a quantity")).toHaveValue("20");

    await page.locator(".mb-3 > .ant-select").click();
    await page.getByText("Yes").click();
    await expect(page.getByRole("main")).toContainText("Yes");

    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

    // Assert that the product was created successfully
    await page.waitForURL("dashboard/admin/products");
    // Success toast shows up
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Product Created Successfully$/ })
        .nth(2)
    ).toBeVisible();

    // Navigated to products page and product shows up in the list
    await expect(page.getByRole("main")).toContainText("Nature Book");
    await expect(page.getByRole("main")).toContainText("Book on Nature");
  });

  test("@admin-only should not allow me to create a product when product name field not filled in", async ({
    page,
  }) => {
    // Arrange + Act
    await page.goto("/dashboard/admin/create-product");

    // Fill in the form and assert that form values are updated correctly
    await page
      .locator("div")
      .filter({ hasText: /^Select a category$/ })
      .first()
      .click();
    await page.getByTitle("Book").locator("div").click();
    await expect(page.getByRole("main")).toContainText("Book");

    await page.getByText("Upload Photo").click();
    await page
      .getByLabel("Upload Photo")
      .setInputFiles("tests/fixtures/test-photo.jpg");
    // Preview shows up
    await expect(
      page.getByRole("img", { name: "product_photo" })
    ).toBeVisible();

    await page.getByRole("textbox", { name: "write a description" }).click();
    await page
      .getByRole("textbox", { name: "write a description" })
      .fill("Book on Nature");
    await expect(page.getByPlaceholder("write a description")).toContainText(
      "Book on Nature"
    );

    await page.getByPlaceholder("write a Price").click();
    await page.getByPlaceholder("write a Price").fill("20");
    await expect(page.getByPlaceholder("write a Price")).toHaveValue("20");

    await page.getByPlaceholder("write a quantity").click();
    await page.getByPlaceholder("write a quantity").fill("20");
    await expect(page.getByPlaceholder("write a quantity")).toHaveValue("20");

    await page.locator(".mb-3 > .ant-select").click();
    await page.getByText("Yes").click();
    await expect(page.getByRole("main")).toContainText("Yes");

    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

    // Assert - Error toast shows up
    await expect(
      page
        .locator("div")
        .filter({ hasText: /^Name is Required$/ })
        .nth(2)
    ).toBeVisible();
  });

  test("@admin-only should not allow me to create a product when product photo is not uploaded", async ({
    page,
  }) => {
    // Arrange + Act
    await page.goto("/dashboard/admin/create-product");

    // Fill in the form and assert that form values are updated correctly
    await page
      .locator("div")
      .filter({ hasText: /^Select a category$/ })
      .first()
      .click();
    await page.getByTitle("Book").locator("div").click();
    await expect(page.getByRole("main")).toContainText("Book");

    await page.getByRole("textbox", { name: "write a name" }).click();
    await page
      .getByRole("textbox", { name: "write a name" })
      .fill("Nature Book");

    await page.getByRole("textbox", { name: "write a description" }).click();
    await page
      .getByRole("textbox", { name: "write a description" })
      .fill("Book on Nature");
    await expect(page.getByPlaceholder("write a description")).toContainText(
      "Book on Nature"
    );

    await page.getByPlaceholder("write a Price").click();
    await page.getByPlaceholder("write a Price").fill("20");
    await expect(page.getByPlaceholder("write a Price")).toHaveValue("20");

    await page.getByPlaceholder("write a quantity").click();
    await page.getByPlaceholder("write a quantity").fill("20");
    await expect(page.getByPlaceholder("write a quantity")).toHaveValue("20");

    await page.locator(".mb-3 > .ant-select").click();
    await page.getByText("Yes").click();
    await expect(page.getByRole("main")).toContainText("Yes");

    await page.getByRole("button", { name: "CREATE PRODUCT" }).click();

    // Assert - Error toast shows up
    await expect(
      page
        .locator("div")
        .filter({
          hasText: /^Photo is Required and should be less than 1mb$/,
        })
        .nth(2)
    ).toBeVisible();
  });
});
