/* eslint-disable no-mixed-spaces-and-tabs */

import { Service } from "typedi";
import { BUSINESS_LOGIC_ERRORS } from "../utils/const/errorCodes";
import prisma from "../utils/driver/prisma";
import {
	CreateFoodRequest,
	CreateIngredientRequest,
	GetFoodRequest,
	GetFoodsRequest,
    GetIngredientsRequest,
} from "../dtos/food.request.dto";
import { HttpException } from "../utils/exceptions/httpException";
import {
	CreateFoodResponse,
	CreateIngredientResponse,
	GetFoodResponse,
	GetFoodsResponse,
	GetIngredientsResponse,
	IngredientsResponse,
} from "../dtos/food.response.dto";
import { logger } from "../utils/logger/logger";
import { Prisma } from "@prisma/client";

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

	public async getFoods(data: GetFoodsRequest): Promise<GetFoodsResponse> {
		try {
			const [foods, total] = await prisma.$transaction([
				prisma.foods.findMany({
					where: {
						name: {
							mode: "insensitive",
							contains: data.name,
						},
						id: data.id,
						externalId: data.externalId,
					},
					select: {
						id: true,
						name: true,
						picture: true,
						externalId: true,
						createdAt: true,
						updatedAt: true,
						deletedAt: true,
						ingredients: {
                            where: {
                                isMainAlergen: true,
                            },
							include: {
								_count: {
									select: {
										allergicUsers: true,
									},
								},
							},
						},
					},
					skip: (data.page - 1) * data.limit,
					take: data.limit,
				}),
				prisma.foods.count({
					where: {
						name: {
                            mode: "insensitive",
							contains: data.name,
						},
						id: data.id,
						externalId: data.externalId,
					},
				}),
			]);
			return new GetFoodsResponse(foods, {
				page: data.page,
				limit: data.limit,
				total: total,
			});
		} catch (error) {
			logger.error(error);
			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"error getting foods"
			);
		}
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
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						throw new HttpException(
							400,
							BUSINESS_LOGIC_ERRORS,
							"food already exists",
							[
								{
									field: "name",
									message: [
										`food with name "${data.name}" already exists`,
									],
								},
							]
						);
					case "P2025":
						throw new HttpException(
							400,
							BUSINESS_LOGIC_ERRORS,
							"ingredient does not exist",
							[
								{
									field: "ingredients",
									message: [
										error.meta
											? (error.meta.cause as string)
											: "ingredient does not exist",
									],
								},
							]
						);
				}
			}

			if (error instanceof HttpException) {
				throw error;
			}

			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"error creating food"
			);
		}
	}

	public async createIngredient(
		data: CreateIngredientRequest
	): Promise<CreateIngredientResponse> {
		try {
			const ingredient = await prisma.ingredients.create({
				data: {
					name: data.name,
					icon: data.icon,
					isMainAlergen: data.isMainAlergen,
				},
			});
			return new CreateIngredientResponse(ingredient);
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2002") {
					throw new HttpException(
						400,
						BUSINESS_LOGIC_ERRORS,
						"ingredients already exists",
						[
							{
								field: "name",
								message: [
									`ingredients with name "${data.name}" already exists`,
								],
							},
						]
					);
				}
			}

			if (error instanceof HttpException) {
				throw error;
			}

			logger.error(error);
			throw new HttpException(
				500,
				BUSINESS_LOGIC_ERRORS,
				"error creating ingredient"
			);
		}
	}

    public async getIngredients(
        data: GetIngredientsRequest
    ): Promise<GetIngredientsResponse> {
        try {
            const [ingredients, total] = await prisma.$transaction([
                prisma.ingredients.findMany({
                    where: {
                        name: {
                            mode: "insensitive",
                            contains: data.name,
                        },
                        isMainAlergen: data.isMainAlergen,
                        deletedAt: null,
                    },
                    include: {
                        _count: {
                            select: {
                                allergicUsers: true,
                            },
                        },
                    },
                    skip: (data.page - 1) * data.limit,
                    take: data.limit,
                }),
                prisma.ingredients.count({
                    where: {
                        name: {
                            mode: "insensitive",
                            contains: data.name,
                        },
                        isMainAlergen: data.isMainAlergen,
                        deletedAt: null,
                    },
                }),
            ]);
            return new GetIngredientsResponse(ingredients, {
                page: data.page,
                limit: data.limit,
                total: total,
            });
        } catch (error) {
            logger.error(error);
            throw new HttpException(
                500,
                BUSINESS_LOGIC_ERRORS,
                "error getting ingredients"
            );
        }
    }
}
