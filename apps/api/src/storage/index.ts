import type { ApiConfig } from "../config.js";
import { MemoryOrderStorage } from "./memory.js";
import { PostgresOrderStorage } from "./postgres.js";
import type { OrderStorage } from "./types.js";

export function createStorage(config: ApiConfig): OrderStorage {
  if (config.storageDriver === "postgres") {
    if (!config.databaseUrl) {
      throw new Error("DATABASE_URL is required when STORAGE_DRIVER=postgres");
    }

    return new PostgresOrderStorage(config.databaseUrl);
  }

  return new MemoryOrderStorage();
}
