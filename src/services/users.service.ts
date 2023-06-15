/* eslint-disable no-mixed-spaces-and-tabs */
import { v4 as uuidv4 } from "uuid";
import {
	DeviceMeta,
	LogInRequest,
	SignUpRequest,
	RefreshTokenRequest,
	GetUserInfoRequest as GetUserDetailRequest,
	VerifyOTPRequest,
	SendOtpRequest,
	PasswordResetRequest,
	UpdateUserPictureRequest as UpdatePictureRequest,
	UpdateProfileRequest,
	UpdateAuthRequest,
} from "../dtos/user.request.dto";
import { ErrorValue, HttpException } from "../utils/exceptions/httpException";
import { hash, compare } from "bcrypt";
import { Service } from "typedi";
import { BUSINESS_LOGIC_ERRORS } from "../utils/const/errorCodes";
import {
	ACCESS_TOKEN_SECRET,
	ACCESS_TOKEN_EXPIRES_IN,
	REFRESH_TOKEN_SECRET,
	REFRESH_TOKEN_EXPIRES_IN,
	OTP_EXPIRES_IN,
} from "../utils/config/config";
import prisma from "../utils/driver/prisma";
import parse from "parse-duration";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { Prisma, users, codes } from "@prisma/client";
import {
	AccessTokenPayload,
	RefreshTokenPayload,
} from "../dtos/token.response.dto";
import {
	TokenPayload,
	SignUpResponse,
	UserDetailResponse,
	VerifyResetPasswordOTPResponse,
} from "../dtos/user.response.dto";
import { logger } from "../utils/logger/logger";
import { Container } from "typedi";
import { EmailDriver } from "../utils/driver/email";
import { CloudStorageDriver } from "../utils/driver/storage";

@Service()
export class UsersService {
	private readonly emailService: EmailDriver = Container.get(EmailDriver);

	private readonly cloudStorageService: CloudStorageDriver =
		Container.get(CloudStorageDriver);

	public async signup(data: SignUpRequest): Promise<SignUpResponse> {
		try {
			const hashedPassword = await hash(data.password, 10);
			const createdUser = await prisma.users.create({
				data: {
					email: data.email,
					password: hashedPassword,
					profile: {
						create: {
							name: data.name,
						},
					},
				},
				include: {
					profile: true,
				},
			});

			return new SignUpResponse(createdUser);
		} catch (e) {
			if (e instanceof Prisma.PrismaClientKnownRequestError) {
				if (e.code === "P2002") {
					logger.error(e);
					throw new HttpException(
						409,
						BUSINESS_LOGIC_ERRORS,
						"user already exists",
						[
							{
								field: "email",
								message: ["email already exists"],
							},
						]
					);
				}
			}

			throw e;
		}
	}

	public async sendActivationOTP(data: SendOtpRequest): Promise<void> {
		try {
			const user = await prisma.users.findUnique({
				where: {
					email: data.email,
				},
			});

			if (!user) {
				throw new HttpException(
					404,
					BUSINESS_LOGIC_ERRORS,
					"user not found",
					[
						{
							field: "email",
							message: ["user with email {email} not found"],
						},
					]
				);
			}

			if (user.isActive) {
				throw new HttpException(
					400,
					BUSINESS_LOGIC_ERRORS,
					"user already activated",
					[
						{
							field: "email",
							message: [
								"user with email {email} already activated",
							],
						},
					]
				);
			}

			this.sendOtp(data);
		} catch (e) {
			logger.error(e);
			if (e instanceof HttpException) {
				throw e;
			}

			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"error sending otp"
			);
		}
	}

	public async sendPasswordResetOTP(data: SendOtpRequest): Promise<void> {
		try {
			const user = await prisma.users.findUnique({
				where: {
					email: data.email,
				},
			});

			if (!user) {
				throw new HttpException(
					404,
					BUSINESS_LOGIC_ERRORS,
					"user not found",
					[
						{
							field: "email",
							message: [
								`user with email ${data.email} not found`,
							],
						},
					]
				);
			}

			if (!user.isActive) {
				throw new HttpException(
					400,
					BUSINESS_LOGIC_ERRORS,
					"user not activated",
					[
						{
							field: "email",
							message: [
								`user with email ${data.email} not activated`,
							],
						},
					]
				);
			}

			this.sendOtp(data);
		} catch (e) {
			logger.error(e);
			if (e instanceof HttpException) {
				throw e;
			}

			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"error sending otp"
			);
		}
	}

	private async sendOtp(data: SendOtpRequest): Promise<void> {
		const user = await prisma.users.findUnique({
			where: {
				email: data.email,
			},
			include: {
				profile: true,
			},
		});

		if (!user) {
			throw new HttpException(
				404,
				BUSINESS_LOGIC_ERRORS,
				"user not found",
				[
					{
						field: "email",
						message: ["user not found"],
					},
				]
			);
		}

		if (data.purpose != "activation" && data.purpose != "passwordReset") {
			throw new HttpException(
				400,
				BUSINESS_LOGIC_ERRORS,
				"invalid purpose",
				[
					{
						field: "purpose",
						message: ["invalid purpose"],
					},
				]
			);
		}

		const otp = Math.floor(100000 + Math.random() * 900000);
		await prisma.codes.create({
			data: {
				code: otp,
				type: data.purpose,
				user: {
					connect: {
						id: user.id,
					},
				},
			},
		});

		let subject: string, html: string;
		if (data.purpose === "activation") {
			subject = "Account Activation";
			html = `<h1>Account Activation</h1><p>Hi ${user.profile.name},</p><p>Thank you for signing up with us. Please use the following code to activate your account.</p><p><b>${otp}</b></p>`;
		} else {
			subject = "Password Reset";
			html = `<h1>Password Reset</h1><p>Hi ${user.profile.name},</p><p>Please use the following code to reset your password.</p><p><b>${otp}</b></p>`;
		}

		await this.emailService.sendEmail(user.email, subject, html);
	}
	private async getOTP(
		email: string,
		code: number,
		purpose: "activation" | "passwordReset"
	): Promise<users & { codes: codes[] }> {
		const savedCode = await prisma.users.findUnique({
			where: {
				email: email,
			},
			include: {
				codes: {
					where: {
						code: code,
						type: purpose,
					},
				},
			},
		});

		if (!savedCode || savedCode.codes.length === 0) {
			throw new HttpException(401, BUSINESS_LOGIC_ERRORS, "invalid otp", [
				{
					field: "code",
					message: ["invalid otp"],
				},
			]);
		}

		if (
			savedCode.codes[0].createdAt <
			new Date(Date.now() - parse(OTP_EXPIRES_IN))
		) {
			throw new HttpException(401, BUSINESS_LOGIC_ERRORS, "otp expired", [
				{
					field: "code",
					message: ["otp expired"],
				},
			]);
		}

		if (savedCode.codes[0].usedAt) {
			throw new HttpException(
				401,
				BUSINESS_LOGIC_ERRORS,
				"otp already used",
				[
					{
						field: "code",
						message: ["otp already used"],
					},
				]
			);
		}

		return savedCode;
	}

	public async verifyActivationOTP(data: VerifyOTPRequest): Promise<void> {
		try {
			const user = await prisma.users.findUnique({
				where: {
					email: data.email,
				},
			});

			if (!user) {
				throw new HttpException(
					404,
					BUSINESS_LOGIC_ERRORS,
					"user not found",
					[
						{
							field: "email",
							message: ["user not found"],
						},
					]
				);
			}

			if (user.isActive) {
				throw new HttpException(
					400,
					BUSINESS_LOGIC_ERRORS,
					"user already activated",
					[
						{
							field: "email",
							message: ["user already activated"],
						},
					]
				);
			}

			const code = await this.getOTP(data.email, data.code, "activation");

			await prisma.$transaction([
				prisma.codes.update({
					data: {
						usedAt: new Date(),
					},
					where: {
						id: code.codes[0].id,
					},
				}),
				prisma.users.update({
					data: {
						isActive: true,
					},
					where: {
						id: code.codes[0].userId,
					},
				}),
			]);
		} catch (e) {
			logger.error(e);
			if (e instanceof HttpException) {
				throw e;
			}
			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"error Factivating account"
			);
		}
	}

	public async verifyResetPasswordOTP(
		data: VerifyOTPRequest
	): Promise<VerifyResetPasswordOTPResponse> {
		try {
			const code = await this.getOTP(
				data.email,
				data.code,
				"passwordReset"
			);

			const token = uuidv4();
			await prisma.$transaction([
				prisma.codes.update({
					data: {
						usedAt: new Date(),
					},
					where: {
						id: code.codes[0].id,
					},
				}),
				prisma.resetTokens.create({
					data: {
						token: token,
						user: {
							connect: {
								id: code.codes[0].userId,
							},
						},
					},
				}),
			]);

			return new VerifyResetPasswordOTPResponse(token);
		} catch (e) {
			logger.error(e);
			if (e instanceof HttpException) {
				throw e;
			}
			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"error creating reset password token"
			);
		}
	}

	public async resetPassword(data: PasswordResetRequest): Promise<void> {
		try {
			const savedToken = await prisma.resetTokens.findUnique({
				where: {
					token: data.token,
				},
			});

			if (!savedToken) {
				throw new HttpException(
					401,
					BUSINESS_LOGIC_ERRORS,
					"invalid token",
					[
						{
							field: "token",
							message: ["invalid token"],
						},
					]
				);
			}

			if (
				savedToken.createdAt <
				new Date(Date.now() - parse(OTP_EXPIRES_IN))
			) {
				throw new HttpException(
					401,
					BUSINESS_LOGIC_ERRORS,
					"token expired",
					[
						{
							field: "token",
							message: ["token expired"],
						},
					]
				);
			}

			if (savedToken.usedAt) {
				throw new HttpException(
					401,
					BUSINESS_LOGIC_ERRORS,
					"token already used",
					[
						{
							field: "token",
							message: ["token already used"],
						},
					]
				);
			}

			const hashedPassword = await hash(data.password, 10);
			await prisma.$transaction([
				prisma.resetTokens.update({
					where: {
						id: savedToken.id,
					},
					data: {
						usedAt: new Date(),
					},
				}),
				prisma.users.update({
					where: {
						id: savedToken.userId,
					},
					data: {
						password: hashedPassword,
					},
				}),
			]);
		} catch (e) {
			logger.error(e);
			if (e instanceof HttpException) {
				throw e;
			}
			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"error resetting password"
			);
		}
	}

	private async generateTokens(
		user: users,
		sessionKey: string,
		isFresh: boolean
	): Promise<TokenPayload> {
		const accessTokenExpiresAt = Math.floor(
			(Date.now() + parse(ACCESS_TOKEN_EXPIRES_IN)) / 1000
		);

		const refreshTokenExpiresAt = Math.floor(
			(Date.now() + parse(REFRESH_TOKEN_EXPIRES_IN)) / 1000
		);

		const accessToken = jwt.sign(
			{
				uid: user.id,
				sid: sessionKey,
				role: user.role,
				category: "access",
				isFresh: isFresh,
				exp: accessTokenExpiresAt,
			},
			ACCESS_TOKEN_SECRET
		);

		const refreshToken = jwt.sign(
			{
				uid: user.id,
				sid: sessionKey,
				category: "refresh",
				exp: refreshTokenExpiresAt,
			},
			REFRESH_TOKEN_SECRET
		);

		return new TokenPayload(
			user.id,
			{
				token: accessToken,
				expiredAt: accessTokenExpiresAt,
			},
			{
				token: refreshToken,
				expiredAt: refreshTokenExpiresAt,
			}
		);
	}

	public async login(
		data: LogInRequest,
		meta: DeviceMeta
	): Promise<TokenPayload> {
		try {
			const storedUser = await prisma.users.findUnique({
				where: { email: data.email },
			});

			const commonError: ErrorValue[] = [
				{
					field: "email",
					message: ["invalid credentials provided"],
				},
				{
					field: "password",
					message: ["invalid credentials provided"],
				},
			];

			if (!storedUser) {
				throw new HttpException(
					401,
					BUSINESS_LOGIC_ERRORS,
					"invalid credentials",
					commonError
				);
			}

			if (!storedUser.isActive) {
				throw new HttpException(
					401,
					BUSINESS_LOGIC_ERRORS,
					"account not activated",
					[
						{
							field: "email",
							message: ["account not activated"],
						},
					]
				);
			}

			const isPasswordCorrect = await compare(
				data.password,
				storedUser.password
			);
			if (!isPasswordCorrect) {
				throw new HttpException(
					401,
					BUSINESS_LOGIC_ERRORS,
					"invalid credentials",
					commonError
				);
			}

			// deactive all other sessions with the same device
			async () => {
				if (meta.deviceId) {
					await prisma.sessions.updateMany({
						where: {
							userId: storedUser.id,
							isActive: true,
							deviceId: meta.deviceId,
						},
						data: {
							isActive: false,
						},
					});
				}
			};

			// uuid session key
			const key = uuidv4();

			// create session
			await prisma.sessions.create({
				data: {
					user: {
						connect: {
							id: storedUser.id,
						},
					},
					deviceId: meta.deviceId,
					deviceName: meta.deviceName,
					ip: meta.ip,
					key: key,
					expiresAt: new Date(
						Date.now() + parse(REFRESH_TOKEN_EXPIRES_IN)
					),
				},
			});

			return await this.generateTokens(storedUser, key, true);
		} catch (e) {
			logger.error(e);
			if (e instanceof HttpException) {
				throw e;
			}

			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"internal server error",
				[
					{
						field: "server",
						message: ["cannot create session"],
					},
				]
			);
		}
	}

	public async refreshTokens(
		data: RefreshTokenRequest,
		meta: DeviceMeta
	): Promise<TokenPayload> {
		let decoded: RefreshTokenPayload;

		try {
			decoded = jwt.verify(
				data.refreshToken,
				REFRESH_TOKEN_SECRET
			) as RefreshTokenPayload;

			if (decoded.category !== "refresh") {
				throw new HttpException(
					401,
					BUSINESS_LOGIC_ERRORS,
					"invalid token",
					[
						{
							field: "refreshToken",
							message: ["token is not a refresh token"],
						},
					]
				);
			}

			const storedSession = await prisma.sessions.findUnique({
				where: {
					key: decoded.sid,
				},
				include: {
					user: true,
				},
			});

			if (!storedSession || !storedSession.isActive) {
				throw new HttpException(
					401,
					BUSINESS_LOGIC_ERRORS,
					"invalid token",
					[
						{
							field: "refreshToken",
							message: ["session does not exist"],
						},
					]
				);
			}

			// uuid session key
			const key = uuidv4();

			// replace session key
			await prisma.sessions.update({
				where: {
					key: decoded.sid,
				},
				data: {
					key: key,
					deviceId: meta.deviceId,
					deviceName: meta.deviceName,
					ip: meta.ip,
					expiresAt: new Date(
						Date.now() + parse(REFRESH_TOKEN_EXPIRES_IN)
					),
					lastUsed: new Date(Date.now()),
				},
			});

			return await this.generateTokens(storedSession.user, key, false);
		} catch (e) {
			logger.error(e);
			if (e instanceof HttpException) {
				throw e;
			}

			if (e instanceof JsonWebTokenError) {
				throw new HttpException(
					401,
					BUSINESS_LOGIC_ERRORS,
					"invalid token",
					[
						{
							field: "refreshToken",
							message: [e.message],
						},
					]
				);
			}

			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"internal server error",
				[
					{
						field: "server",
						message: ["cannot create session"],
					},
				]
			);
		}
	}

	public async validateAccessToken(token: AccessTokenPayload): Promise<{
		uid: string;
		role: string;
		isFresh: boolean;
	}> {
		try {
			const storedSession = await prisma.sessions.findUnique({
				where: {
					key: token.sid,
				},
			});

			if (!storedSession || !storedSession.isActive) {
				throw new HttpException(
					401,
					BUSINESS_LOGIC_ERRORS,
					"invalid token",
					[
						{
							field: "authorization",
							message: ["session does not exist"],
						},
					]
				);
			}

			return {
				uid: token.uid,
				role: token.role,
				isFresh: token.isFresh,
			};
		} catch (e) {
			logger.error(e);
			if (e instanceof HttpException) {
				throw e;
			}

			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"internal server error",
				[
					{
						field: "server",
						message: ["cannot validate session"],
					},
				]
			);
		}
	}

	public async logout(token: AccessTokenPayload): Promise<void> {
		try {
			await prisma.sessions.update({
				where: {
					key: token.sid,
				},
				data: {
					isActive: false,
				},
			});

			return;
		} catch (e) {
			logger.error(e);

			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"internal server error",
				[
					{
						field: "server",
						message: ["cannot logout"],
					},
				]
			);
		}
	}

	public async getUserDetail(
		data: GetUserDetailRequest
	): Promise<UserDetailResponse> {
		try {
			const storedUser = await prisma.users.findUnique({
				where: {
					id: data.id,
				},
				include: {
					alergens: true,
					profile: true,
				},
			});

			if (!storedUser) {
				throw new HttpException(
					404,
					BUSINESS_LOGIC_ERRORS,
					"user not found",
					[
						{
							field: "uid",
							message: ["user does not exist"],
						},
					]
				);
			}

			return new UserDetailResponse(storedUser);
		} catch (e) {
			logger.error(e);
			if (e instanceof HttpException) {
				throw e;
			}

			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"internal server error",
				[
					{
						field: "server",
						message: ["cannot get user detail"],
					},
				]
			);
		}
	}

	public async updatePicture(data: UpdatePictureRequest): Promise<void> {
		try {
			const pictureUrl = await this.cloudStorageService.uploadImage(
				data.picture,
				data.id
			);

			await prisma.users.update({
				where: {
					id: data.id,
				},
				data: {
					profile: {
						update: {
							avatar: pictureUrl,
						},
					},
				},
			});

			return;
		} catch (e) {
			logger.error(e);
			if (e instanceof HttpException) {
				throw e;
			}

			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"cannot update user picture"
			);
		}
	}

	public async updateProfile(data: UpdateProfileRequest): Promise<void> {
		try {
			const storedUser = await prisma.users.findUnique({
				where: {
					id: data.id,
				},
				select: {
					alergens: {
						select: {
							id: true,
						},
					},
				},
			});

			if (!storedUser) {
				throw new HttpException(
					404,
					BUSINESS_LOGIC_ERRORS,
					"user not found",
					[
						{
							field: "uid",
							message: ["user does not exist"],
						},
					]
				);
			}

			await prisma.users.update({
				where: {
					id: data.id,
				},
				data: {
					profile: {
						update: {
							name: data.name,
						},
					},
					alergens: data.alergens
						? {
								connect: data.alergens.map((alergen) => ({
									id: alergen,
								})),
								disconnect: storedUser.alergens.map(
									(alergen) => ({
										id: alergen.id,
									})
								),
						  }
						: undefined,
				},
			});

			return;
		} catch (e) {
			logger.error(e);
			if (e instanceof Prisma.PrismaClientKnownRequestError) {
				if (e.code === "P2025") {
					throw new HttpException(
						400,
						BUSINESS_LOGIC_ERRORS,
						"alergens does not exist",
						[
							{
								field: "alergens",
								message: [
									e.meta
										? (e.meta.cause as string)
										: "alergen does not exist",
								],
							},
						]
					);
				}
			}

			if (e instanceof HttpException) {
				throw e;
			}

			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"cannot update user profile"
			);
		}
	}

	public async updateAuth(data: UpdateAuthRequest): Promise<void> {
		try {
			let hashedPassword: string | undefined;
			if (data.password) {
				hashedPassword = await hash(data.password, 10);
			}

			await prisma.$transaction([
				prisma.users.update({
					where: {
						id: data.id,
					},
					data: {
						email: data.email,
						password: hashedPassword,
                        // if email is updated, deactivate user
						isActive: data.email ? false : true ,
					},
				}),
				prisma.sessions.updateMany({
					where: {
						userId: data.id,
					},
					data: {
                        // deactive all sessions
						isActive: false,
					},
				}),
			]);

			return;
		} catch (e) {
			logger.error(e);
			if (e instanceof HttpException) {
				throw e;
			}

			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"cannot update user authentification detail"
			);
		}
	}
}
