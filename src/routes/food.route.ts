import { Router } from "express";
import { Routes } from "../utils/interfaces/routers.interface";
import { FoodController } from "../controllers/food.controller";
import { AuthMiddleware } from "../utils/middlewares/auth.middleware";
import {
	BodyValidationMiddleware,
	QueryValidationMiddleware,
} from "../utils/middlewares/validation.middleware";
import {
	CreateFoodRequest,
	CreateIngredientRequest,
	GetFoodsRequest,
	GetIngredientsRequest,
} from "../dtos/food.request.dto";
import { multerMiddleware } from "../utils/middlewares/multipart.middleware";

export class FoodRoute implements Routes {
	public path = "/foods";
	public router = Router();
	public foodController = new FoodController();

	constructor() {
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.post(
			`${this.path}/ingredients/`,
			AuthMiddleware(["admin"], true),
			BodyValidationMiddleware(CreateIngredientRequest),
			this.foodController.createIngredient
		);
		this.router.get(
			`${this.path}/ingredients/`,
			QueryValidationMiddleware(GetIngredientsRequest),
			this.foodController.getIngredients
		);
        this.router.post(
            `${this.path}/predict/`,
            AuthMiddleware(),
            multerMiddleware.single("file"),
            this.foodController.predictImage
        );
		this.router.get(
			`${this.path}/:id/`,
			AuthMiddleware(),
			this.foodController.getFood
		);
		this.router.get(
			`${this.path}/`,
			QueryValidationMiddleware(GetFoodsRequest),
			this.foodController.getFoods
		);
		this.router.post(
			`${this.path}/`,
			AuthMiddleware(["admin"], true),
			BodyValidationMiddleware(CreateFoodRequest),
			this.foodController.createFood
		);
	}
}
