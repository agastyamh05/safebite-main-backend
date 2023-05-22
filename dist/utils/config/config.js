"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN_EXPIRES_IN = exports.REFRESH_TOKEN_SECRET = exports.ACCESS_TOKEN_EXPIRES_IN = exports.ACCESS_TOKEN_SECRET = exports.ORIGIN = exports.PORT = exports.LOG_DIR = exports.LOG_FORMAT = exports.CREDENTIALS = exports.NODE_ENV = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({
    path: `.env.${process.env.NODE_ENV || "development"}`,
});
const NODE_ENV = process.env.NODE_ENV || "development";
exports.NODE_ENV = NODE_ENV;
const CREDENTIALS = process.env.CREDENTIALS === "true";
exports.CREDENTIALS = CREDENTIALS;
const LOG_FORMAT = process.env.LOG_FORMAT || "combined";
exports.LOG_FORMAT = LOG_FORMAT;
const LOG_DIR = process.env.LOG_DIR || "logs";
exports.LOG_DIR = LOG_DIR;
const PORT = process.env.PORT || 3000;
exports.PORT = PORT;
const ORIGIN = process.env.ORIGIN || "*";
exports.ORIGIN = ORIGIN;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access";
exports.ACCESS_TOKEN_SECRET = ACCESS_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
exports.ACCESS_TOKEN_EXPIRES_IN = ACCESS_TOKEN_EXPIRES_IN;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh";
exports.REFRESH_TOKEN_SECRET = REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
exports.REFRESH_TOKEN_EXPIRES_IN = REFRESH_TOKEN_EXPIRES_IN;
