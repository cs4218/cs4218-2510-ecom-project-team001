import { test as base, expect } from "@playwright/test";

export const testAdmin = base.extend({
  storageState: "tests/ui/.auth/admin.json",
});

// Run tests in parallel to speed up execution
testAdmin.describe.configure({ mode: "parallel" });

testAdmin.describe("Create Category Page", () => {
  let context;
  let page;

  testAdmin.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  testAdmin.beforeEach(async ({ page }) => {
    // Ensure that categories used in tests are cleaned up
    await page.goto("/dashboard/admin/create-category");
    const categoryNames = await page
      .locator("tbody tr td:nth-child(1)")
      .allTextContents();

    console.log("Existing categories:", categoryNames);
    for (const name of categoryNames) {
      const categoriesToDelete = [
        "Accessories",
        "Accessories By Cheng Hou",
        "Accessories by Li Yuan",
      ];
      if (categoriesToDelete.includes(name)) {
        await page
          .getByRole("row", { name: new RegExp(`^${name} Edit Delete$`) })
          .getByRole("button")
          .nth(1)
          .click();
      }
    }
  });

  testAdmin.afterAll(async () => {});

  testAdmin(
    "should allow me to create a non-empty category",
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
    }
  );

  testAdmin(
    "should allow me to update an existing category",
    async ({ page }) => {
      // Arrange
      // Add an existing category
      await page.goto("/dashboard/admin/create-category");
      await page
        .getByRole("textbox", { name: "Enter new category (max" })
        .click();
      await page
        .getByRole("textbox", { name: "Enter new category (max" })
        .fill("Accessories");
      await page.getByRole("button", { name: "Submit" }).click();

      // Act
      await page
        .getByRole("row", { name: "Accessories Edit Delete" })
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
      await expect(page.locator("tbody")).toContainText(
        "Accessories By Cheng Hou"
      );
    }
  );

  testAdmin(
    "should allow me to delete an existing category",
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
      // Success toast shows up
      await expect(page.getByText("category is deleted")).toBeVisible();
    }
  );
});
