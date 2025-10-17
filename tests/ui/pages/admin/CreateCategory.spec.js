import { test as base, expect } from "@playwright/test";

export const testAdmin = base.extend({
  storageState: "tests/ui/.auth/admin.json",
});

const cleanupCategories = async (page) => {
  await page.goto("/dashboard/admin/create-category");
  const categoryNames = await page
    .locator("tbody tr td:nth-child(1)")
    .allTextContents();

  for (const name of categoryNames) {
    const categoriesToDelete = [
      "Accessories",
      "Accessories By Cheng Hou",
      "Accessories by Li Yuan",
      "Accessories by Aaron",
    ];
    if (categoriesToDelete.includes(name)) {
      await page
        .getByRole("row", { name: new RegExp(`^${name} Edit Delete$`) })
        .getByRole("button")
        .nth(1)
        .click();
    }
  }
};

testAdmin.describe("Create Category Page", () => {
  let context;
  let page;

  testAdmin.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  testAdmin.beforeEach(async ({ page }) => {
    // Ensure that categories used in tests are cleaned up
    await cleanupCategories(page);
  });

  testAdmin.afterEach(async ({ page }) => {
    // Ensure that categories used in tests are cleaned up
    await cleanupCategories(page);
  });

  testAdmin(
    "@admin-only should allow me to create a non-empty category",
    async ({ page }) => {
      // Arrange
      await page.goto("/dashboard/admin/create-category");
      // Act
      await page
        .getByRole("textbox", { name: "Enter new category (max" })
        .click();
      await page
        .getByRole("textbox", { name: "Enter new category (max" })
        .fill("Accessories");
      await page.getByRole("button", { name: "Submit" }).click();

      // Assert
      const lastRow = page.locator("tbody tr").last();
      await expect(lastRow).toContainText("Accessories");

      // Cleanup
      await page
        .getByRole("row", { name: "Accessories" })
        .getByRole("button", { name: "Delete" })
        .click();
      await expect(page.getByText("category is deleted")).toBeVisible();
    }
  );

  testAdmin(
    "@admin-only should allow me to update an existing category",
    async ({ page }) => {
      // Arrange
      // Add an existing category
      await page.goto("/dashboard/admin/create-category");
      await page
        .getByRole("textbox", { name: "Enter new category (max" })
        .click();
      await page
        .getByRole("textbox", { name: "Enter new category (max" })
        .fill("Accessories by Aaron");
      await page.getByRole("button", { name: "Submit" }).click();

      // Act
      await page
        .getByRole("row", { name: "Accessories by Aaron Edit Delete" })
        .getByRole("button")
        .first()
        .click();
      await page
        .getByRole("dialog", { name: "Update Category" })
        .getByPlaceholder("Enter new category (max")
        .click();
      await page
        .getByRole("dialog", { name: "Update Category" })
        .getByPlaceholder("Enter new category (max")
        .press("ControlOrMeta+a");
      await page
        .getByRole("dialog", { name: "Update Category" })
        .getByPlaceholder("Enter new category (max")
        .fill("Accessories By Cheng Hou");
      await page
        .getByLabel("Update Category")
        .getByRole("button", { name: "Submit" })
        .click();
      // Assert
      await expect(page.locator("tbody")).toContainText(
        "Accessories By Cheng Hou"
      );
    }
  );

  testAdmin(
    "@admin-only should allow me to delete an existing category",
    async ({ page }) => {
      // Arrange
      // Add an existing category
      await page.goto("/dashboard/admin/create-category");
      await page
        .getByRole("textbox", { name: "Enter new category (max" })
        .click();
      await page
        .getByRole("textbox", { name: "Enter new category (max" })
        .fill("Accessories by Li Yuan");
      await page.getByRole("button", { name: "Submit" }).click();

      // Act
      await page
        .getByRole("row", { name: "Accessories by Li Yuan" })
        .getByRole("button", { name: "Delete" })
        .click();
      // Assert - Success toast shows up
      await expect(page.getByText("category is deleted")).toBeVisible();
    }
  );
});
