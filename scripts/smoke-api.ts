interface SmokeOrder {
  id: string;
  status: string;
  customerName: string;
}

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";

async function main(): Promise<void> {
  const health = await requestJson<{ service: string; storage: { mode: string } }>("/health");
  assert(health.service === "pulsecart-api", "health service name should be pulsecart-api");

  const created = await requestJson<SmokeOrder>("/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      customerId: "smoke-customer",
      customerName: "Smoke Test Buyer",
      items: [
        {
          sku: "SKU-COFFEE",
          name: "Cold brew concentrate",
          quantity: 1,
          unitPriceCents: 1499
        }
      ]
    })
  });
  assert(created.status === "pending", "created order should start pending");

  const fetched = await requestJson<SmokeOrder>(`/orders/${created.id}`);
  assert(fetched.customerName === "Smoke Test Buyer", "created order should be readable");

  const fulfillment = await requestJson<{ order: SmokeOrder }>(`/orders/${created.id}/fulfill`, {
    method: "POST"
  });
  assert(fulfillment.order.status === "fulfilled", "created order should fulfill");

  const metrics = await requestText("/metrics");
  assert(metrics.includes("pulsecart_orders_total"), "metrics should include order total");

  console.log(
    `Smoke passed for ${apiBaseUrl} using ${health.storage.mode} storage and order ${created.id}`
  );
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  const body = (await response.json().catch(() => ({}))) as T & { message?: string };

  if (!response.ok) {
    throw new Error(body.message ?? `${path} failed with HTTP ${response.status}`);
  }

  return body;
}

async function requestText(path: string): Promise<string> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${path} failed with HTTP ${response.status}: ${body}`);
  }

  return body;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);

  if (message === "fetch failed") {
    console.error(`Smoke failed: could not reach PulseCart API at ${apiBaseUrl}.`);
    console.error("Start the API first, for example:");
    console.error("  rtk pnpm --filter @pulsecart/api dev");
    console.error("Or set API_BASE_URL to a running deployment before retrying.");
  } else {
    console.error(message);
  }

  process.exitCode = 1;
});
