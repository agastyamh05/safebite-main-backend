import { Request, Response, NextFunction } from "express";
import { Container } from "typedi";
import { UsersService } from "../../services/users.service";
import { AccessTokenPayload } from "../../dtos/token.response.dto";
import { ACCESS_TOKEN_SECRET } from "../config/config";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { HttpException } from "../exceptions/httpException";
import { BUSINESS_LOGIC_ERRORS, VALIDATION_ERRORS } from "../const/errorCodes";

const getAuthorizationToken = (req: Request): string | null => {
	const authorizationHeader = req.headers.authorization;
	if (!authorizationHeader) return null;

	const token = authorizationHeader.split(" ")[1];
	return token;
};

const userService: UsersService = Container.get(UsersService);

export const AuthMiddleware = (
	rolesWhitelist: string[] = [],
	strict = false,
	onlyFresh = false
): ((req: Request, res: Response, next: NextFunction) => void) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const token = getAuthorizationToken(req);
		if (!token && strict) {
			res.status(401).json({
				statusCode: 401,
				message: "Unauthorized",
			});
			return;
		}

		if (!token) {
			res.locals.isAnonymous = true;
			next();
			return;
		}

		try {
			res.locals.isAnonymous = false;

			const decoded = jwt.verify(
				token,
				ACCESS_TOKEN_SECRET
			) as AccessTokenPayload;

			if (decoded.category !== "access") {
				throw new HttpException(
					401,
					BUSINESS_LOGIC_ERRORS,
					"invalid token",
					[
						{
							field: "authorization",
							message: ["token is not access token"],
						},
					]
				);
			}

			if (onlyFresh && !decoded.isFresh) {
				throw new HttpException(
					401,
					BUSINESS_LOGIC_ERRORS,
					"need fresh token, please login again"
				);
			}

			const user = await userService.validateAccessToken(decoded);
			if (
				rolesWhitelist.length != 0 &&
				!rolesWhitelist.includes(user.role)
			) {
				throw new HttpException(
					403,
					BUSINESS_LOGIC_ERRORS,
					"user role is not allowed to access this resource"
				);
			}

			res.locals.user = user;
			res.locals.token = decoded;
			next();
		} catch (error) {
			if (error instanceof HttpException) {
				res.status(error.status).json(error);
				return;
			}

			if (error instanceof TokenExpiredError) {
				res.status(401).json({
					status: 401,
                    statusCode: VALIDATION_ERRORS,
					message: "token expired",
				});

				return;
			}

			if (error instanceof JsonWebTokenError) {
				res.status(401).json({
					statusCode: 401,
					message: "Unauthorized",
				});

				return;
			}

			next(error);
		}
	};
};
