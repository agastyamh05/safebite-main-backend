import { Router } from "express";
import { Routes } from "../utils/interfaces/routers.interface";
import { FoodController } from "../controllers/food.controller";



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
            this.foodController.getFood
        );
    }
}
