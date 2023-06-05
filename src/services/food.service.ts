/* eslint-disable no-mixed-spaces-and-tabs */

import { Service } from "typedi";
import { BUSINESS_LOGIC_ERRORS } from "../utils/const/const";
import prisma from "../utils/driver/prisma";
import { GetFoodRequest } from "../dtos/food.dto";
import { HttpException } from "../utils/exceptions/httpException";
import { ingredients } from "@prisma/client";

class Ingredients {
    public id: number;
	public name: string;
	public icon: string | null;
	public isMainAlergen: boolean;
	public userAlergic: number;
	public createdAt: Date;
	public updatedAt: Date;
    
	constructor(
		Ingredients: ingredients & {
			_count: {
				allergicUsers: number;
			};
		}
	) {
		this.id = Ingredients.id;
		this.name = Ingredients.name;
		this.icon = Ingredients.icon;
		this.isMainAlergen = Ingredients.isMainAlergen;
		this.userAlergic = Ingredients._count.allergicUsers;
		this.createdAt = Ingredients.createdAt;
		this.updatedAt = Ingredients.updatedAt;
	}
}

@Service()
export class FoodService {
	public async getFood(data: GetFoodRequest): Promise<{
		id: number;
		name: string;
		picture: string;
		externalId: string | null;
		description: string | null;
		alergic: Ingredients[];
		ingredients: Ingredients[];
	}> {
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
			return new Ingredients(ingredient);
		});

		let alergic: Ingredients[] = [];

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

		return {
			id: storedFood.id,
			name: storedFood.name,
			picture: storedFood.picture,
			externalId: storedFood.externalId,
			description: storedFood.description,
			alergic: alergic,
			ingredients: storedIngredients,
		};
	}
}
