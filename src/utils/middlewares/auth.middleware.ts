import { Request, Response, NextFunction } from "express";
import { Container } from "typedi";
import { UsersService } from "../../services/users.service";
import { AccessTokenPayload } from "../../dtos/token.dto";
import { ACCESS_TOKEN_SECRET } from "../config/config";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { HttpException } from "../exceptions/httpException";
import { BUSINESS_LOGIC_ERRORS } from "../const/const";

const getAuthorizationToken = (req: Request): string | null => {
	const authorizationHeader = req.headers.authorization;
	if (!authorizationHeader) return null;

	const token = authorizationHeader.split(" ")[1];
	return token;
};

const userService: UsersService = Container.get(UsersService);

export const AuthMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const token = getAuthorizationToken(req);
	if (!token) {
		res.status(401).json({
			statusCode: 401,
			message: "Unauthorized",
		});
		return;
	}

	let decoded: AccessTokenPayload;
	try {
		decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
	} catch (e) {
		if (e instanceof JsonWebTokenError) {
			throw new HttpException(
				401,
				BUSINESS_LOGIC_ERRORS,
				"invalid token",
				[
					{
						field: "authorization",
						message: [e.message],
					},
				]
			);
		}

		throw e;
	}

	if (decoded.category !== "access") {
		throw new HttpException(401, BUSINESS_LOGIC_ERRORS, "invalid token", [
			{
				field: "authorization",
				message: ["token is not access token"],
			},
		]);
	}

	try {
		const user = await userService.validateAccessToken(decoded);
		res.locals.user = user;
        res.locals.token = decoded;
		next();
	} catch (error) {
		next(error);
	}
};
