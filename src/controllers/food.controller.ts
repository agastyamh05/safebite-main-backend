import { NextFunction, Request, Response } from "express";
import { Container } from "typedi";
import { SUCCESS } from "../utils/const/const";
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
            res.status(201).json({
                statusCode: SUCCESS,
                message: "success retrieving food",
                data: storedFood,
            })
        }catch(error) {
            next(error);
        }
    };
}