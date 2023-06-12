import { config } from "dotenv";
import Container, { Token } from "typedi";
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
const EMAIL_HOST = new Token<string>("smtp.gmail.com");
Container.set(EMAIL_HOST, process.env.EMAIL_HOST)

const EMAIL_PORT = new Token<number>;
Container.set(EMAIL_PORT, parseInt(process.env.EMAIL_PORT || "587"));

const EMAIL_SECURE = new Token<boolean>;
Container.set(EMAIL_SECURE, process.env.EMAIL_SECURE === "true");

const EMAIL_USER = new Token<string>;
Container.set(EMAIL_USER, process.env.EMAIL_USER );

const EMAIL_PASSWORD = new Token<string>;
Container.set(EMAIL_PASSWORD, process.env.EMAIL_PASSWORD );


const GOOGLE_CLOUD_PROJECT_ID = new Token<string>;
Container.set(GOOGLE_CLOUD_PROJECT_ID, process.env.GOOGLE_CLOUD_PROJECT_ID);

const GOOGLE_CLOUD_KEY_FILE = new Token<string>("");
Container.set(GOOGLE_CLOUD_KEY_FILE, process.env.GOOGLE_CLOUD_KEY_FILE);

const STORAGE_BUCKET = new Token<string>;
Container.set(STORAGE_BUCKET, process.env.STORAGE_BUCKET);

const OTP_EXPIRES_IN = process.env.OTP_EXPIRES_IN || "15m";

// Non env variables 
const IMAGES_FOLDER = "images";

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
	GOOGLE_CLOUD_PROJECT_ID,
	GOOGLE_CLOUD_KEY_FILE,
    STORAGE_BUCKET,
    IMAGES_FOLDER
};
