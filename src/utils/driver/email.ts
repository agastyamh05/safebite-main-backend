// Email driver to send email to users through Mailgun smtp


import {  Service } from "typedi";
import * as nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
// import { Logger } from "../logger";
import { EMAIL_HOST, EMAIL_PASSWORD, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER } from "../config/config";
import { HttpException } from "../exceptions/httpException";
import { BUSINESS_LOGIC_ERRORS } from "../const/errorCodes";
import { logger } from "../logger/logger";

@Service()
export class EmailDriver {
	// private readonly logger = new Logger(EmailDriver.name);
	private readonly mailer: Mail;

	constructor() {
		const smtpConfig: SMTPTransport.Options = {
			host: EMAIL_HOST,
			port: EMAIL_PORT,
			secure: EMAIL_SECURE,
			auth: {
				user: EMAIL_USER,
				pass: EMAIL_PASSWORD,
			},
		};

		this.mailer = nodemailer.createTransport(smtpConfig);
	}

	public async sendEmail(
		to: string,
		subject: string,
		html: string,
		// text?: string
	) {
		try {
			await this.mailer.sendMail({
				from: EMAIL_USER,
				to,
				subject,
				// text,
				html,
			});
		} catch (e) {
			logger.error(e);
			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"email service error",
				[
					{
						field: "email",
						message: ["email service error"],
					},
				]
			);
		}
	}
}

