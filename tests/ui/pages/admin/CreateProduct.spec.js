import { test, expect } from "@playwright/test";

// Run tests in parallel to speed up execution
test.describe.configure({ mode: "parallel" });

test.describe("Create Product Page", () => {
  test("should allow me to create a product when all fields filled in", async ({
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
      .setInputFiles("tests/fixtures/photo.png");
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
});
