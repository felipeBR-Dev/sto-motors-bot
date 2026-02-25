const winston = require("winston");
const { logPrefix } = require("../config");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(info => `${info.timestamp} ${logPrefix} ${info.level.toUpperCase()}: ${info.message}`)
  ),
  transports: [new winston.transports.Console()]
});

module.exports = { logger };