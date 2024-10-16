import config from "@/config";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import winston from "winston";
import winstonDaily from "winston-daily-rotate-file";

// logs directory
const logDir: string = join(__dirname, config.logs.directory);

if (!existsSync(logDir)) {
  mkdirSync(logDir);
}

const logFormat = winston.format.printf(
  ({ timestamp, level, message }) => `${timestamp} [${level}]:: ${message}`
);

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    logFormat
  ),
  transports: [
    // debug log setting
    new winstonDaily({
      level: "debug",
      datePattern: "YYYY-MM-DD",
      dirname: logDir + "/debug", // log file /logs/debug/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      json: false,
      zippedArchive: true,
    }),
    // error log setting
    new winstonDaily({
      level: "error",
      datePattern: "YYYY-MM-DD",
      dirname: logDir + "/error", // log file /logs/error/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      json: false,
      zippedArchive: true,
    }),
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.splat(),
      winston.format.colorize({ all: true })
    ),
  })
);

const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf("\n")));
  },
};

export { logger, stream };
