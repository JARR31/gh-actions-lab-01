import { createClient } from "redis";
import type { DependencyHealth } from "./storage/types.js";

type RedisClient = ReturnType<typeof createClient>;

export class RedisMonitor {
  private readonly redisUrl: string | undefined;
  private client: RedisClient | undefined;
  private connected = false;
  private lastError: string | undefined;

  constructor(redisUrl?: string) {
    this.redisUrl = redisUrl;
  }

  async connect(): Promise<void> {
    if (!this.redisUrl) {
      return;
    }

    this.client = createClient({
      url: this.redisUrl
    });
    this.client.on("error", (error) => {
      this.connected = false;
      this.lastError = error instanceof Error ? error.message : "redis error";
    });

    try {
      await this.client.connect();
      this.connected = true;
      this.lastError = undefined;
    } catch (error) {
      this.connected = false;
      this.lastError = error instanceof Error ? error.message : "redis connection failed";
    }
  }

  async incrementRequestCount(): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      await this.client.incr("pulsecart:requests");
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : "redis increment failed";
    }
  }

  async getRequestCount(): Promise<number | null> {
    if (!this.client || !this.connected) {
      return null;
    }

    const rawValue = await this.client.get("pulsecart:requests");
    return rawValue ? Number.parseInt(rawValue, 10) : 0;
  }

  async health(): Promise<DependencyHealth> {
    if (!this.redisUrl) {
      return {
        configured: false,
        ok: true,
        message: "redis not configured"
      };
    }

    if (!this.client || !this.connected) {
      return {
        configured: true,
        ok: false,
        message: this.lastError ?? "redis not connected"
      };
    }

    try {
      const pong = await this.client.ping();
      return {
        configured: true,
        ok: pong === "PONG",
        message: pong
      };
    } catch (error) {
      return {
        configured: true,
        ok: false,
        message: error instanceof Error ? error.message : "redis ping failed"
      };
    }
  }

  async close(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit();
    }

    this.connected = false;
  }
}
