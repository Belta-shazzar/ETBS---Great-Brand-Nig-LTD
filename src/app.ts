import "reflect-metadata";
import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import hpp from "hpp";
import { Routes } from "@interfaces/routes.interface";
import config from "@/config";
import { logger, stream } from "@/utils/logger";
import { ErrorMiddleware } from "@/middlewares/error.middleware";
import { HttpException } from "./exceptions/http.exception";
import ResponseInterceptor from "./middlewares/transform-response.middleware";
import rateLimit from "express-rate-limit";
import prisma from "./config/prisma";

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = config.app.node_env || "development";
    this.port = config.app.port || 3000;

    this.initializeMiddlewares();
    this.initializeResponseTransform();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  public listen() {
    prisma
      .$connect()
      .then(() => {
        logger.info("🟢 Database connection successful");
        this.app.listen(this.port, () => {
          logger.info(`======= ENV: ${this.env} ========`);
          logger.info(`🚀 App listening on the port ${this.port}`);
        });
      })
      .catch((error) => {
        logger.error("An error occurred: ", error);
      });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(morgan(config.logs.format, { stream }));
    this.app.use(
      cors({ origin: config.cors.origin, credentials: config.cors.credentials })
    );
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next) => {
          next(new HttpException(429, `Rate limit exceeded for IP: ${req.ip}`));
        },
      })
    );
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      this.app.use("/", route.router);
    });

    this.app.use((req, res, next) => {
      throw new HttpException(404, "URL not Found");
    });
  }

  private initializeResponseTransform() {
    this.app.use(ResponseInterceptor);
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }
}
