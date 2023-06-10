import { Router } from "express";
import { Routes } from "../utils/interfaces/routers.interface";
import { FoodController } from "../controllers/food.controller";
import { AuthMiddleware } from "../utils/middlewares/auth.middleware";
import { ValidationMiddleware } from "../utils/middlewares/validation.middleware";
import { CreateFoodRequest } from "../dtos/food.request.dto";

export class FoodRoute implements Routes {
	public path = "/foods";
	public router = Router();
	public foodController = new FoodController();

	constructor() {
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.get(
			`${this.path}/:id/`,
			AuthMiddleware([], false),
			this.foodController.getFood
		);
        this.router.post(
            `${this.path}/`,
            AuthMiddleware(["admin"], true),
            ValidationMiddleware(CreateFoodRequest),
            this.foodController.createFood
        );
	}
}
