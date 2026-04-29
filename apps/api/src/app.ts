import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import {
  DomainValidationError,
  InvalidStatusTransitionError,
  fulfillOrder,
  type CreateOrderInput
} from "@pulsecart/domain";
import { loadConfig, type ApiConfig } from "./config.js";
import { RedisMonitor } from "./redis-monitor.js";
import { createStorage } from "./storage/index.js";
import type { OrderStorage } from "./storage/types.js";

interface BuildAppOptions {
  config?: ApiConfig;
  storage?: OrderStorage;
  redis?: RedisMonitor;
  logger?: boolean;
}

interface IdParams {
  id: string;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  const storage = options.storage ?? createStorage(config);
  const redis = options.redis ?? new RedisMonitor(config.redisUrl);
  const app = Fastify({
    logger: options.logger ?? config.nodeEnv !== "test"
  });

  await app.register(cors, {
    origin: true
  });

  await storage.initialize();
  await redis.connect();

  app.addHook("onRequest", async () => {
    void redis.incrementRequestCount();
  });

  app.addHook("onClose", async () => {
    await redis.close();
    await storage.close();
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof DomainValidationError) {
      return reply.code(400).send({
        error: error.name,
        message: error.message,
        details: error.details
      });
    }

    if (error instanceof InvalidStatusTransitionError) {
      return reply.code(409).send({
        error: error.name,
        message: error.message,
        from: error.from,
        to: error.to
      });
    }

    app.log.error(error);
    return reply.code(500).send({
      error: "InternalServerError",
      message: "Unexpected API failure"
    });
  });

  app.get("/health", async () => {
    const [storageHealth, redisHealth] = await Promise.all([storage.health(), redis.health()]);

    return {
      service: config.serviceName,
      version: config.version,
      uptime: Math.round(process.uptime()),
      storage: {
        mode: storage.mode
      },
      dependencies: {
        storage: storageHealth,
        redis: redisHealth
      }
    };
  });

  app.get("/orders", async () => {
    const orders = await storage.listOrders();
    return {
      data: orders,
      count: orders.length
    };
  });

  app.post<{ Body: CreateOrderInput }>("/orders", async (request, reply) => {
    const order = await storage.createOrder(request.body);
    return reply.code(201).send(order);
  });

  app.get<{ Params: IdParams }>("/orders/:id", async (request, reply) => {
    const order = await storage.getOrder(request.params.id);

    if (!order) {
      return reply.code(404).send({
        error: "OrderNotFound",
        message: `Order ${request.params.id} was not found`
      });
    }

    return order;
  });

  app.post<{ Params: IdParams }>("/orders/:id/fulfill", async (request, reply) => {
    const order = await storage.getOrder(request.params.id);

    if (!order) {
      return reply.code(404).send({
        error: "OrderNotFound",
        message: `Order ${request.params.id} was not found`
      });
    }

    const result = fulfillOrder(order);
    await storage.updateOrder(result.order);
    return reply.send(result);
  });

  app.get("/metrics", async (_request, reply) => {
    const orders = await storage.listOrders();
    const requestCount = await redis.getRequestCount();
    const byStatus = orders.reduce(
      (totals, order) => {
        totals[order.status] += 1;
        return totals;
      },
      { pending: 0, fulfilled: 0, cancelled: 0 }
    );

    const lines = [
      "# HELP pulsecart_orders_total Total orders known to the API",
      "# TYPE pulsecart_orders_total gauge",
      `pulsecart_orders_total ${orders.length}`,
      "# HELP pulsecart_orders_by_status Orders partitioned by status",
      "# TYPE pulsecart_orders_by_status gauge",
      `pulsecart_orders_by_status{status="pending"} ${byStatus.pending}`,
      `pulsecart_orders_by_status{status="fulfilled"} ${byStatus.fulfilled}`,
      `pulsecart_orders_by_status{status="cancelled"} ${byStatus.cancelled}`,
      "# HELP pulsecart_uptime_seconds API process uptime in seconds",
      "# TYPE pulsecart_uptime_seconds gauge",
      `pulsecart_uptime_seconds ${Math.round(process.uptime())}`,
      "# HELP pulsecart_storage_driver Active storage driver",
      "# TYPE pulsecart_storage_driver gauge",
      `pulsecart_storage_driver{driver="${storage.mode}"} 1`
    ];

    if (requestCount !== null) {
      lines.push("# HELP pulsecart_redis_requests_total API requests counted through Redis");
      lines.push("# TYPE pulsecart_redis_requests_total counter");
      lines.push(`pulsecart_redis_requests_total ${requestCount}`);
    }

    return reply.type("text/plain; version=0.0.4").send(`${lines.join("\n")}\n`);
  });

  return app;
}
