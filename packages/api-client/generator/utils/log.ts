import * as loglevel from "loglevel";

/*
 * Logger object singleton
 */
let logger: loglevel.Logger | null = null;

/**
 * Logging levels
 */
export type LoggingLevel = "info" | "debug" | "warn" | "error" | "silent";

/**
 * Sets logging level
 *
 * @param level
 */
export function setLevel(level: LoggingLevel): void {
  getLogger().setLevel(level);
}

/**
 * Gets logging level
 */
export function getLevel(): LoggingLevel {
  switch (getLogger().getLevel()) {
    case 1:
      return "debug";
    case 2:
      return "info";
    case 3:
      return "warn";
    case 4:
      return "error";
    case 5:
      return "silent";
    default:
      return "silent";
  }
}

/**
 * Gets logger object instance
 */
function getLogger() {
  logger = loglevel.getLogger("logger");
  return logger;
}

/**
 * Logs info level message.
 *
 * @param message - Message to be logged
 */
export function info(message: string): void {
  getLogger().info(`[ClientGenerator] INFO: ${message}`);
}

/**
 * Logs raw message as error.
 *
 * @param message - Message to be logged
 */
export function log(message: string): void {
  getLogger().error(message);
}

/**
 * Logs error level message.
 *
 * @param message - Error to be logged
 */
export function error(message: string): void {
  getLogger().error(`[ClientGenerator] ERROR: ${message}`);
}

/**
 * Logs warning level message.
 *
 * @param message - Warning to be logged
 */
export function warn(message: string): void {
  getLogger().warn(`[ClientGenerator] WARN: ${message}`);
}

/**
 * Logs fatal message and terminates the program.
 *
 * @param message - Fatal error to be logged
 */
export function fatal(message: string): void {
  getLogger().error(`[ClientGenerator] FATAL: ${message}`);
  process.exit(1);
}
