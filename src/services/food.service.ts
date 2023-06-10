/* eslint-disable no-mixed-spaces-and-tabs */

import { Service } from "typedi";
import { BUSINESS_LOGIC_ERRORS } from "../utils/const/errorCodes";
import prisma from "../utils/driver/prisma";
import { CreateFoodRequest, GetFoodRequest } from "../dtos/food.request.dto";
import { HttpException } from "../utils/exceptions/httpException";
import {
	CreateFoodResponse,
	GetFoodResponse,
	IngredientsResponse,
} from "../dtos/food.response.dto";
import { logger } from "../utils/logger/logger";

@Service()
export class FoodService {
	public async getFood(data: GetFoodRequest): Promise<GetFoodResponse> {
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

		return new GetFoodResponse(storedFood, storedIngredients, alergic);
	}

	public async createFood(
		data: CreateFoodRequest
	): Promise<CreateFoodResponse> {
		try {
			const food = await prisma.foods.create({
				data: {
					name: data.name,
					description: data.description,
					picture: data.picture,
					externalId: data.externalId,
					ingredients: {
						connect: data.ingredients.map((ingredient) => {
							return {
								id: ingredient,
							};
						}),
					},
				},
			});
			return new CreateFoodResponse(food);
		} catch (error) {
			logger.error(error);
			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"error creating food"
			);
		}
	}
}
