import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ClipboardList,
  PackageCheck,
  Plus,
  RefreshCw,
  Rocket,
  Server
} from "lucide-react";
import { createOrder, getHealth, getOrders, type HealthResponse, type Order } from "./api.js";

type Page = "dashboard" | "orders" | "deployments";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function refreshData(showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }
    setMessage(null);

    try {
      const [healthResponse, ordersResponse] = await Promise.all([getHealth(), getOrders()]);
      setHealth(healthResponse);
      setOrders(ordersResponse.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load PulseCart data");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void refreshData();
  }, []);

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
    [orders]
  );

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <PackageCheck aria-hidden="true" />
          <span>PulseCart</span>
        </div>
        <nav className="nav-tabs">
          <button
            className={page === "dashboard" ? "active" : ""}
            type="button"
            onClick={() => setPage("dashboard")}
          >
            <Activity aria-hidden="true" />
            Dashboard
          </button>
          <button
            className={page === "orders" ? "active" : ""}
            type="button"
            onClick={() => setPage("orders")}
          >
            <ClipboardList aria-hidden="true" />
            Orders
          </button>
          <button
            className={page === "deployments" ? "active" : ""}
            type="button"
            onClick={() => setPage("deployments")}
          >
            <Rocket aria-hidden="true" />
            Deployments
          </button>
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">B2B fulfillment operations</p>
            <h1>{pageTitle(page)}</h1>
          </div>
          <button className="icon-button" type="button" onClick={() => void refreshData()}>
            <RefreshCw aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </header>

        {message ? <div className="alert">{message}</div> : null}
        {loading ? <div className="loading">Loading PulseCart data...</div> : null}

        {!loading && page === "dashboard" ? (
          <Dashboard health={health} orders={orders} pendingOrders={pendingOrders} />
        ) : null}
        {!loading && page === "orders" ? (
          <OrdersPage orders={orders} onCreated={() => void refreshData(false)} />
        ) : null}
        {!loading && page === "deployments" ? <DeploymentsPage /> : null}
      </section>
    </main>
  );
}

function Dashboard({
  health,
  orders,
  pendingOrders
}: {
  health: HealthResponse | null;
  orders: Order[];
  pendingOrders: number;
}) {
  return (
    <div className="dashboard-grid">
      <StatusCard
        icon={<Server aria-hidden="true" />}
        label="API service"
        value={health?.service ?? "Unavailable"}
        detail={health ? `v${health.version} on ${health.storage.mode}` : "No health response"}
      />
      <StatusCard
        icon={<ClipboardList aria-hidden="true" />}
        label="Orders"
        value={String(orders.length)}
        detail={`${pendingOrders} pending fulfillment`}
      />
      <StatusCard
        icon={<Activity aria-hidden="true" />}
        label="Dependencies"
        value={health ? dependencySummary(health) : "Unknown"}
        detail="PostgreSQL and Redis are optional by mode"
      />
    </div>
  );
}

function OrdersPage({ orders, onCreated }: { orders: Order[]; onCreated: () => void }) {
  const [customerName, setCustomerName] = useState("Acme Regional Foods");
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormMessage(null);

    try {
      await createOrder({
        customerId: `customer-${Date.now()}`,
        customerName,
        items: [
          {
            sku: "SKU-FILTER",
            name: "Commercial filter pack",
            quantity: 1,
            unitPriceCents: 899
          }
        ]
      });
      setFormMessage("Order created");
      onCreated();
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Order creation failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="orders-layout">
      <form className="order-form" onSubmit={(event) => void handleSubmit(event)}>
        <h2>Create demo order</h2>
        <label htmlFor="customerName">Customer name</label>
        <input
          id="customerName"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
        />
        <p className="form-detail">Adds one commercial filter pack using the public API.</p>
        <button type="submit" disabled={submitting || customerName.trim().length === 0}>
          <Plus aria-hidden="true" />
          {submitting ? "Creating..." : "Create order"}
        </button>
        {formMessage ? <p className="form-message">{formMessage}</p> : null}
      </form>

      <section className="order-list" aria-label="Orders">
        {orders.map((order) => (
          <article className="order-row" key={order.id}>
            <div>
              <h3>{order.customerName}</h3>
              <p>{order.id}</p>
            </div>
            <span className={`status status-${order.status}`}>{order.status}</span>
            <strong>{formatter.format(order.totalCents / 100)}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}

function DeploymentsPage() {
  return (
    <div className="deployment-grid">
      <StatusCard
        icon={<Rocket aria-hidden="true" />}
        label="Staging"
        value="Manifest ready"
        detail="Connect governance and promotion workflow later"
      />
      <StatusCard
        icon={<Rocket aria-hidden="true" />}
        label="Production"
        value="Awaiting release"
        detail="Protected deployment policy belongs in the lab"
      />
      <StatusCard
        icon={<Activity aria-hidden="true" />}
        label="Smoke checks"
        value="API script available"
        detail="Use pnpm smoke after the service is reachable"
      />
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  detail
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="status-card">
      <div className="card-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
        <span>{detail}</span>
      </div>
    </article>
  );
}

function pageTitle(page: Page): string {
  if (page === "orders") {
    return "Orders";
  }

  if (page === "deployments") {
    return "Deployments";
  }

  return "Operations Dashboard";
}

function dependencySummary(health: HealthResponse): string {
  const dependencies = Object.values(health.dependencies);
  const unhealthy = dependencies.filter((dependency) => dependency.configured && !dependency.ok);
  return unhealthy.length === 0 ? "Healthy" : `${unhealthy.length} degraded`;
}
