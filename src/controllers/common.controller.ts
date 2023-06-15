import { NextFunction, Request, Response } from "express";
import { Container } from "typedi";
import { SUCCESS } from "../utils/const/errorCodes";

export class CommonController {
	public getHealth = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			if (Container.get("ready")) {
				res.status(200).json({
					statusCode: SUCCESS,
					message: "healthy",
					data: {
						uptime: process.uptime(),
						responseTime: process.hrtime(),
						timestamp: Date.now(),
					},
				});
			} else {
				res.status(503).json({
					statusCode: SUCCESS,
					message: "unhealthy",
				});
			}
		} catch (error) {
			next(error);
		}
	};
}
