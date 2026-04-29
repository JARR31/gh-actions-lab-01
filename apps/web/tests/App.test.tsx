import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App.js";

const demoOrder = {
  id: "order-demo-001",
  customerId: "customer-demo",
  customerName: "Summit Office Supply",
  status: "pending",
  items: [
    {
      sku: "SKU-COFFEE",
      name: "Cold brew concentrate",
      quantity: 1,
      unitPriceCents: 1499
    }
  ],
  totalCents: 1499,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("PulseCart web app", () => {
  beforeEach(() => {
    const orders = [demoOrder];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url.endsWith("/health")) {
          return jsonResponse({
            service: "pulsecart-api",
            version: "0.1.0",
            uptime: 12,
            storage: { mode: "memory" },
            dependencies: {
              storage: { configured: true, ok: true },
              redis: { configured: false, ok: true }
            }
          });
        }

        if (url.endsWith("/orders") && init?.method === "POST") {
          const created = {
            ...demoOrder,
            id: "order-created-001",
            customerName: "Acme Regional Foods"
          };
          orders.push(created);
          return jsonResponse(created, 201);
        }

        if (url.endsWith("/orders")) {
          return jsonResponse({
            data: orders,
            count: orders.length
          });
        }

        return jsonResponse({ message: "not found" }, 404);
      })
    );
  });

  it("renders the dashboard", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Operations Dashboard" })).toBeVisible();
    expect(await screen.findByText("pulsecart-api")).toBeVisible();
    expect(screen.getByText("1 pending fulfillment")).toBeVisible();
  });

  it("renders the orders page", async () => {
    render(<App />);
    await screen.findByText("pulsecart-api");

    await userEvent.click(screen.getByRole("button", { name: /orders/i }));

    expect(screen.getByRole("heading", { name: "Orders" })).toBeVisible();
    expect(screen.getByText("Summit Office Supply")).toBeVisible();
    expect(screen.getByRole("button", { name: /create order/i })).toBeVisible();
  });

  it("creates an order from the orders page", async () => {
    render(<App />);
    await screen.findByText("pulsecart-api");

    await userEvent.click(screen.getByRole("button", { name: /orders/i }));
    await userEvent.clear(screen.getByLabelText("Customer name"));
    await userEvent.type(screen.getByLabelText("Customer name"), "Acme Regional Foods");
    await userEvent.click(screen.getByRole("button", { name: /create order/i }));

    expect(await screen.findByText("Order created")).toBeVisible();
    await waitFor(() => expect(screen.getByText("Acme Regional Foods")).toBeVisible());
  });

  it("renders the deployments page", async () => {
    render(<App />);
    await screen.findByText("pulsecart-api");

    await userEvent.click(screen.getByRole("button", { name: /deployments/i }));

    expect(screen.getByRole("heading", { name: "Deployments" })).toBeVisible();
    expect(screen.getByText("Manifest ready")).toBeVisible();
    expect(screen.getByText("Awaiting release")).toBeVisible();
  });
});
