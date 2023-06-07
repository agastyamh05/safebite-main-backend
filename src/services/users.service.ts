/* eslint-disable no-mixed-spaces-and-tabs */
import { v4 as uuidv4 } from "uuid";
import {
	DeviceMeta,
	LogInRequest,
	SignUpRequest,
	RefreshTokenRequest,
	GetUserInfoRequest as GetUserDetailRequest,
	ActivateAccountRequest,
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
} from "../utils/config/config";
import prisma from "../utils/driver/prisma";
import parse from "parse-duration";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { Prisma, users } from "@prisma/client";
import {
	AccessTokenPayload,
	RefreshTokenPayload,
} from "../dtos/token.response.dto";
import {
	TokenPayload,
	SignUpResponse,
	UserDetailResponse,
} from "../dtos/user.response.dto";
import { logger } from "../utils/logger/logger";
import { Container } from "typedi";
import { EmailDriver } from "../utils/driver/email";

@Service()
export class UsersService {
	private readonly email: EmailDriver = Container.get(EmailDriver);

	public async signup(data: SignUpRequest): Promise<SignUpResponse> {
		const hashedPassword = await hash(data.password, 10);
		let createdUser: users;

		try {
			createdUser = await prisma.users.create({
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

			const otp = Math.floor(100000 + Math.random() * 900000);
			await prisma.codes.create({
				data: {
					code: otp,
					type: "activation",
					user: {
						connect: {
							id: createdUser.id,
						},
					},
				},
			});

			await this.email.sendEmail(
				createdUser.email,
				"Account Activation",
				`<h1>Account Activation</h1><p>Hi ${data.name},</p><p>Thank you for signing up with us. Please use the following code to activate your account.</p><p><b>${otp}</b></p>`
			);

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

	public async activateAccount(data: ActivateAccountRequest): Promise<void> {
		const code = await prisma.users.findUnique({
			where: {
				email: data.email,
			},
			select: {
				codes: {
					where: {
						code: data.code,
						type: "activation",
						usedAt: null,
					},
				},
			},
		});

		if (!code) {
			throw new HttpException(401, BUSINESS_LOGIC_ERRORS, "invalid otp", [
				{
					field: "code",
					message: ["invalid otp"],
				},
			]);
		}

		if (code.codes[0].code != data.code) {
			throw new HttpException(401, BUSINESS_LOGIC_ERRORS, "invalid otp", [
				{
					field: "code",
					message: ["invalid otp"],
				},
			]);
		}

		try {
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
			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"error activating account"
			);
		}
	}

	private async generateTokens(
		user: users,
		sessionKey: string,
		isFresh: boolean
	): Promise<TokenPayload> {
		const accessTokenExpiresAt =
			Date.now() + parse(ACCESS_TOKEN_EXPIRES_IN);
		const refreshTokenExpiresAt =
			Date.now() + parse(REFRESH_TOKEN_EXPIRES_IN);

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

		try {
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
		} catch (e) {
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

			throw e;
		}

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

		try {
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
}
