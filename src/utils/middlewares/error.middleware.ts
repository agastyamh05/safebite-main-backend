import { NextFunction, Request, Response } from "express";
import { HttpException } from "../exceptions/httpException";
import { logger } from "../logger/logger";
import { INTERNAL_SERVER_ERRORS } from "../const/errorCodes";

export const ErrorMiddleware = (
	error: Error,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
        if(error instanceof SyntaxError) {
            res.status(400).json({
                statusCode: 400,
                message: "invalid json body",
                errors: error.stack
            });
            return;
        }

		if (error instanceof HttpException) {
			const status: number = error.status || 500;
			const message: string = error.message || "Something went wrong";

			logger.error(
				`${req.method} ${req.path} ${status} Message: ${message}`
			);
			res.status(status).json({
				statusCode: error.statusCode,
				message,
				errors: error.errors,
			});
            return;
		}

        res.status(500).json({
            statusCode: INTERNAL_SERVER_ERRORS,
            message: error.message,
            errors: error.stack
        });
        return;
	} catch (error) {
		next(error);
	}
};
