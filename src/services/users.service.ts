import { v4 as uuidv4 } from "uuid";
import {
	DeviceMeta,
	LogInRequest,
	SignUpRequest,
	RefreshTokenRequest,
} from "../dtos/users.dto";
import { ErrorValue, HttpException } from "../utils/exceptions/httpException";
import { hash, compare } from "bcrypt";
import { Service } from "typedi";
import { BUSINESS_LOGIC_ERRORS } from "../utils/const/const";
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
import { AccessTokenPayload, RefreshTokenPayload } from "../dtos/token.dto";

@Service()
export class UsersService {
	public async signup(data: SignUpRequest): Promise<{
		uuid: string;
	}> {
		const hashedPassword = await hash(data.password, 10);
		let createdUser: users;

		try {
			createdUser = await prisma.users.create({
				data: {
					email: data.email,
					password: hashedPassword,
				},
			});
		} catch (e) {
			if (e instanceof Prisma.PrismaClientKnownRequestError) {
				if (e.code === "P2002") {
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

		return {
			uuid: createdUser.id,
		};
	}

	private async generateTokens(
		user: users,
		sessionKey: string,
		isFresh: boolean
	): Promise<{
		uuid: string;
		access: {
			token: string;
			expiredAt: number;
		};
		refresh: {
			token: string;
			expiredAt: number;
		};
	}> {
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

		return {
			uuid: user.id,
			access: {
				token: accessToken,
				expiredAt: accessTokenExpiresAt,
			},
			refresh: {
				token: refreshToken,
				expiredAt: refreshTokenExpiresAt,
			},
		};
	}

	public async login(
		data: LogInRequest,
		meta: DeviceMeta
	): Promise<{
		uuid: string;
		access: {
			token: string;
			expiredAt: number;
		};
		refresh: {
			token: string;
			expiredAt: number;
		};
	}> {
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
	}

	public async refreshTokens(
		data: RefreshTokenRequest,
		meta: DeviceMeta
	): Promise<{
		uuid: string;
		access: {
			token: string;
			expiredAt: number;
		};
		refresh: {
			token: string;
			expiredAt: number;
		};
	}> {
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
	}

	public async validateAccessToken(token: AccessTokenPayload): Promise<{
		uid: string;
		role: string;
		isFresh: boolean;
	}> {
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
	}

	public async logout(token: AccessTokenPayload): Promise<void> {
		await prisma.sessions.update({
			where: {
				key: token.sid,
			},
			data: {
				isActive: false,
			},
		});

		return;
	}
}
