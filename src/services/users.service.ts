import { v4 as uuidv4 } from "uuid";
import { DeviceMeta, LogInRequest, SignUpRequest } from "../dtos/users.dto";
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
import jwt from "jsonwebtoken";

@Service()
export class UsersService {
	public async signup(data: SignUpRequest): Promise<void> {
		const storedUser = await prisma.users.findUnique({
			where: { email: data.email },
		});
		if (storedUser) {
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

		const hashedPassword = await hash(data.password, 10);
		await prisma.users.create({
			data: {
				email: data.email,
				password: hashedPassword,
				name: data.name,
			},
		});

		return;
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
		const accessTokenExpiresAt =
			Date.now() + parse(ACCESS_TOKEN_EXPIRES_IN);
		const refreshTokenExpiresAt =
			Date.now() + parse(REFRESH_TOKEN_EXPIRES_IN);

		// create session
		await prisma.sessions.create({
			data: {
                user: {
                    connect: {
                        id: storedUser.id
                    }
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

		const accessToken = jwt.sign(
			{
				uid: storedUser.id,
				sessionKey: key,
				category: "access",
				isFresh: true,
				exp: accessTokenExpiresAt,
			},
			ACCESS_TOKEN_SECRET
		);

		const refreshToken = jwt.sign(
			{
				uid: storedUser.id,
				sessionKey: key,
				category: "refresh",
				exp: refreshTokenExpiresAt,
			},
			REFRESH_TOKEN_SECRET
		);

		return {
			uuid: storedUser.id,
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
}
