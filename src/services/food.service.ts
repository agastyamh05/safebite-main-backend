/* eslint-disable no-mixed-spaces-and-tabs */

import { Service } from "typedi";
import { BUSINESS_LOGIC_ERRORS } from "../utils/const/const";
import prisma from "../utils/driver/prisma";
import { GetFoodRequest } from "../dtos/food.dto";
import { HttpException } from "../utils/exceptions/httpException";

@Service()
export class FoodService {
    public async getFood(data: GetFoodRequest): Promise<{
        id: number;
        name: string;
        picture: string;
        externalId: string | null;
        description: string | null;
        alergic: {
            id: number;
            userAlergic: number;
            name: string;
            icon: string;
        }[]
        ingredients: {
            id: number;
            name: string;
            icon: string | null;
        }[] | null 
    }> {
        const storedFood = await prisma.foods.findUnique({
            where: {
                id: data.id,
            },
            include: { ingredients: true }
        });
        if (!storedFood) {
            throw new HttpException(
                404,
                BUSINESS_LOGIC_ERRORS,
                "food not found",
                [
                    {
                        field: "id",
                        message: ["food does not exist"]
                    }
                ]
            )
        }
        return {
            id: storedFood.id,
            name: storedFood.name,
            picture: storedFood.picture,
            externalId: storedFood.externalId,
            description: storedFood.description,
            alergic: [{
                id: 12,
                userAlergic:122,
                name: "pork",
                icon: "asdkja"
            }],
            ingredients: storedFood.ingredients,
        };
    }
}
