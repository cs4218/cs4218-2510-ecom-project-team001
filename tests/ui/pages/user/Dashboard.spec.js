import { test as base, expect } from "@playwright/test";

const test = base.extend({
  storageState: "tests/ui/.auth/user.json",
});

test.describe("Dashboard/UserMenu UI/E2E tests", () => {
  let page;
  let context;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("clicking Profile navigates to /dashboard/user/profile", async () => {
    // Arrange
    await page.goto("/dashboard/user");
    const profileLink = page.getByRole("link", { name: /^profile$/i });
    await expect(profileLink).toBeVisible();

    // Act
    await profileLink.click();

    // Assert
    await expect(page).toHaveURL(/\/dashboard\/user\/profile/);
  });

  test("clicking Orders navigates to /dashboard/user/orders", async () => {
    // Arrange
    await page.goto("/dashboard/user");
    const ordersLink = page.getByRole("link", { name: /^orders$/i });
    await expect(ordersLink).toBeVisible();

    // Act
    await ordersLink.click();

    // Assert
    await expect(page).toHaveURL(/\/dashboard\/user\/orders/);
  });
});
