import { Config } from "@/interfaces/config.interface";
import dotenv from "dotenv";

// const envPath = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: ".env" });

const config: Config = {
  app: {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    jwtSecret: process.env.SECRET_KEY!,
    node_env: process.env.NODE_ENV!,
  },
  cors: {
    origin: process.env.CORS_ORIGIN!,
    credentials: Boolean(process.env.CORS_CREDENTIALS!),
  },
  logs: {
    format: process.env.LOG_FORMAT!,
    directory: process.env.LOG_DIR!,
  },
};

export default config;
