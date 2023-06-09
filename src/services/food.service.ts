/* eslint-disable no-mixed-spaces-and-tabs */

import { Service } from "typedi";
import { BUSINESS_LOGIC_ERRORS } from "../utils/const/errorCodes";
import prisma from "../utils/driver/prisma";
import { GetFoodRequest } from "../dtos/food.request.dto";
import { HttpException } from "../utils/exceptions/httpException";
import { FoodResponse, IngredientsResponse } from "../dtos/food.response.dto";

@Service()
export class FoodService {
	public async getFood(data: GetFoodRequest): Promise<FoodResponse> {
		const storedFood = await prisma.foods.findUnique({
			where: {
				id: data.id,
			},
			include: {
				ingredients: {
					include: {
						_count: {
							select: {
								allergicUsers: true,
							},
						},
					},
				},
			},
		});
		if (!storedFood) {
			throw new HttpException(
				404,
				BUSINESS_LOGIC_ERRORS,
				"food not found",
				[
					{
						field: "id",
						message: ["food does not exist"],
					},
				]
			);
		}

		const storedIngredients = storedFood.ingredients.map((ingredient) => {
			return new IngredientsResponse(ingredient);
		});

		let alergic: IngredientsResponse[] = [];

		if (data.userId) {
			const alergens = await prisma.users.findMany({
				where: {
					id: data.userId,
				},
				include: {
					alergens: {
						select: {
							id: true,
						},
					},
				},
			});


			// check if user is alergic to any ingredient of the food, if so, add it to the response
			if (alergens[0].alergens.length > 0) {
				alergic = storedIngredients.filter((ingredient) => {
					return alergens[0].alergens.some((alergen) => {
						return alergen.id === ingredient.id;
					});
				});
			}
		}

		return new FoodResponse(storedFood, storedIngredients, alergic);
	}
    public async createFood (data: GetFoodRequest): Promise <{
        id: number;
    }>{
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
                "can not create food",
                [
                    {
                        field: "id",
                        message: ["food does not exist"]
                    }
                ]
            )
        }
        return{
            id: storedFood.id,
        }
    }
}
