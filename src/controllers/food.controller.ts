import { NextFunction, Request, Response } from "express";
import { Container } from "typedi";
import { SUCCESS } from "../utils/const/errorCodes";
import { FoodService } from "../services/food.service";

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
					? req.query.isMainAlergen === "true"
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
}
