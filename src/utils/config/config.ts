import { config } from "dotenv";
if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
	config({
		path: `.env.${process.env.NODE_ENV || "development"}.local`,
	});
}

const NODE_ENV = process.env.NODE_ENV || "development";
const CREDENTIALS = process.env.CREDENTIALS === "true";
const LOG_FORMAT = process.env.LOG_FORMAT || "combined";
const LOG_DIR = process.env.LOG_DIR || "logs";
const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.ORIGIN || "*";
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "access";
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// Email config
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = +(process.env.EMAIL_PORT || "587");
const EMAIL_SECURE = process.env.EMAIL_SECURE === "true";
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const OTP_EXPIRES_IN = process.env.OTP_EXPIRES_IN || "15m";

export {
	NODE_ENV,
	CREDENTIALS,
	LOG_FORMAT,
	LOG_DIR,
	PORT,
	ORIGIN,
	ACCESS_TOKEN_SECRET,
	ACCESS_TOKEN_EXPIRES_IN,
	REFRESH_TOKEN_SECRET,
	REFRESH_TOKEN_EXPIRES_IN,
	EMAIL_HOST,
	EMAIL_PORT,
	EMAIL_SECURE,
	EMAIL_USER,
	EMAIL_PASSWORD,
    OTP_EXPIRES_IN,
};
