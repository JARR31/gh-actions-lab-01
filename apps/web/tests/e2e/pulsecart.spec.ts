import { expect, test } from "@playwright/test";

test("loads dashboard and creates an order", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Operations Dashboard" })).toBeVisible();
  await expect(page.getByText("pulsecart-api")).toBeVisible();

  await page.getByRole("button", { name: /orders/i }).click();
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();

  await page.getByLabel("Customer name").fill("E2E Buyer Co");
  await page.getByRole("button", { name: /create order/i }).click();
  await expect(page.getByText("Order created")).toBeVisible();
  await expect(page.getByText("E2E Buyer Co")).toBeVisible();
});
