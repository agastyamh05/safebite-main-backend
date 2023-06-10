import { NextFunction, Request, Response } from "express";
import { Container } from "typedi";
import { SUCCESS } from "../utils/const/errorCodes";
import { FoodService } from "../services/food.service";

export class FoodController {
    private foodService: FoodService = Container.get(FoodService);

    public getFood = async(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try{
            const storedFood = await this.foodService.getFood({
                id: +req.params.id,
                userId: res.locals.user ? res.locals.user.uid : null,
            })
            res.status(200).json({
                statusCode: SUCCESS,
                message: "success retrieving food",
                data: storedFood,
            })
        }catch(error) {
            next(error);
        }
    };
    public createFood = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const storedFood = await this.foodService.createFood(req.body)
            res.status(201).json({
                statusCode: SUCCESS,
                message: "success creating food",
                data: storedFood,
            })
        }
        catch (error) {
            next(error);
        }
    }
}