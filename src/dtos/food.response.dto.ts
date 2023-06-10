import { foods, ingredients } from "@prisma/client";

export class IngredientsResponse {
	public id: number;
	public name: string;
	public icon: string | null;
	public isMainAlergen: boolean;
	public userAlergic: number;
	public createdAt: Date;
	public updatedAt: Date;

	constructor(
		ingredients: ingredients & {
			_count: {
				allergicUsers: number;
			};
		}
	) {
		this.id = ingredients.id;
		this.name = ingredients.name;
		this.icon = ingredients.icon;
		this.isMainAlergen = ingredients.isMainAlergen;
		this.userAlergic = ingredients._count.allergicUsers;
		this.createdAt = ingredients.createdAt;
		this.updatedAt = ingredients.updatedAt;
	}
}

export class GetFoodResponse {
	public id: number;
	public name: string;
	public picture: string;
	public externalId: string | null;
	public description: string | null;
	public alergic: IngredientsResponse[];
	public ingredients: IngredientsResponse[];

	constructor(
		food: foods,
		ingredients: IngredientsResponse[],
		alergic: IngredientsResponse[]
	) {
		this.id = food.id;
		this.name = food.name;
		this.picture = food.picture;
		this.externalId = food.externalId;
		this.description = food.description;
		this.ingredients = ingredients;
		this.alergic = alergic;
	}
}

class BriefFoodsResponse {
	public id: number;
	public name: string;
	public picture: string;
	public externalId: string | null;
	public ingredients: IngredientsResponse[];

	constructor(
		food: foods & {
			ingredients: (ingredients & {
				_count: {
					allergicUsers: number;
				};
			})[];
		}
	) {
		this.id = food.id;
		this.name = food.name;
		this.picture = food.picture;
		this.externalId = food.externalId;

		this.ingredients = food.ingredients.map((ingredient) => {
			return new IngredientsResponse(ingredient);
		});
	}
}

export class GetFoodsResponse {
	public foods: BriefFoodsResponse[];

	constructor(
		foods: (foods & {
			ingredients: (ingredients & {
				_count: {
					allergicUsers: number;
				};
			})[];
		})[]
	) {
		this.foods = foods.map((food) => {
			return new BriefFoodsResponse(food);
		});
	}
}

export class CreateFoodResponse {
	public id: number;

	constructor(food: foods) {
		this.id = food.id;
	}
}

export class CreateIngredientResponse {
	public id: number;

	constructor(ingredient: ingredients) {
		this.id = ingredient.id;
	}
}
