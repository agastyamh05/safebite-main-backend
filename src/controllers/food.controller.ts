import { NextFunction, Request, Response } from "express";
import { Container } from "typedi";
import { SUCCESS, VALIDATION_ERRORS } from "../utils/const/errorCodes";
import { FoodService } from "../services/food.service";
import { HttpException } from "../utils/exceptions/httpException";

export class FoodController {
	private foodService: FoodService = Container.get(FoodService);

	public getFood = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const storedFood = await this.foodService.getFood({
				id: +req.params.id,
				userId: res.locals.user ? res.locals.user.uid : null,
			});
			res.status(200).json({
				statusCode: SUCCESS,
				message: "success retrieving food",
				data: storedFood,
			});
		} catch (error) {
			next(error);
		}
	};

	public getFoods = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const storedFoods = await this.foodService.getFoods({
				limit: req.query.limit ? +req.query.limit : 10,
				page: req.query.page ? +req.query.page : 1,
				id: req.query.id ? +req.query.id : undefined,
				externalId: req.query.externalId
					? (req.query.externalId as string)
					: undefined,
				name: req.query.name as string,
			});
			res.status(200).json({
				statusCode: SUCCESS,
				message: "success retrieving foods",
				data: storedFoods,
			});
		} catch (error) {
			next(error);
		}
	};

	public createFood = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const storedFood = await this.foodService.createFood(req.body);
			res.status(201).json({
				statusCode: SUCCESS,
				message: "success creating food",
				data: storedFood,
			});
		} catch (error) {
			next(error);
		}
	};

	public createIngredient = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const storedIngredient = await this.foodService.createIngredient(
				req.body
			);
			res.status(201).json({
				statusCode: SUCCESS,
				message: "success creating ingredient",
				data: storedIngredient,
			});
		} catch (error) {
			next(error);
		}
	};

	public getIngredients = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const storedIngredients = await this.foodService.getIngredients({
				limit: req.query.limit ? +req.query.limit : 10,
				page: req.query.page ? +req.query.page : 1,
				isMainAlergen: req.query.mainAlergenOnly
					? req.query.mainAlergenOnly === "true"
					: undefined,
				name: req.query.name as string,
			});
			res.status(200).json({
				statusCode: SUCCESS,
				message: "success retrieving ingredients",
				data: storedIngredients,
			});
		} catch (error) {
			next(error);
		}
	};

	public predictImage = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const file = req.file;
			if (!file) {
				throw new HttpException(
					400,
					VALIDATION_ERRORS,
					"file is required",
					[
						{
							field: "file",
							message: ["file is required"],
						},
					]
				);
			}

			// validate file type
			const fileType = file.mimetype.split("/")[0];
			if (fileType !== "image") {
				throw new HttpException(
					400,
					VALIDATION_ERRORS,
					"file type must be image",
					[
						{
							field: "file",
							message: ["file type must be image"],
						},
					]
				);
			}

			// const supportedFileTypes = ["jpg", "jpeg", "png"];
			// // validate file type from extension and buffer
			// const fileExtension = file.originalname.split(".").pop();
			// if (!fileExtension || !supportedFileTypes.includes(fileExtension)) {
			// 	throw new HttpException(
			// 		400,
			// 		VALIDATION_ERRORS,
			// 		"file type is not supported"
			// 	);
			// }

			const predictedFood = await this.foodService.predictImage({
				image: file.buffer,
                userId: res.locals.user ? res.locals.user.uid : null,
			});
			res.status(200).json({
				statusCode: SUCCESS,
				message: "success predicting image",
				data: predictedFood,
			});
		} catch (error) {
			next(error);
		}
	};
}
