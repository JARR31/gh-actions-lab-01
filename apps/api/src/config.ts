export type StorageDriver = "memory" | "postgres";

export interface ApiConfig {
  serviceName: string;
  version: string;
  port: number;
  storageDriver: StorageDriver;
  nodeEnv: string;
  databaseUrl?: string;
  redisUrl?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const storageDriver = parseStorageDriver(env.STORAGE_DRIVER);
  const config: ApiConfig = {
    serviceName: "pulsecart-api",
    version: env.npm_package_version ?? "0.1.0",
    port: Number.parseInt(env.API_PORT ?? "3000", 10),
    storageDriver,
    nodeEnv: env.NODE_ENV ?? "development"
  };

  if (env.DATABASE_URL) {
    config.databaseUrl = env.DATABASE_URL;
  }

  if (env.REDIS_URL) {
    config.redisUrl = env.REDIS_URL;
  }

  return config;
}

function parseStorageDriver(value: string | undefined): StorageDriver {
  if (value === "postgres") {
    return "postgres";
  }

  return "memory";
}
