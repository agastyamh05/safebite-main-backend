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
	public ingredients: BriefIngredientsResponse[];

	constructor(food: {
		id: number;
		externalId: string | null;
		name: string;
		ingredients: (ingredients & {
			_count: {
				allergicUsers: number;
			};
		})[];
		createdAt: Date;
		updatedAt: Date;
		deletedAt: Date | null;
		picture: string;
	}) {
		this.id = food.id;
		this.name = food.name;
		this.picture = food.picture;
		this.externalId = food.externalId;

		this.ingredients = food.ingredients.map((ingredient) => {
			return new BriefIngredientsResponse(ingredient);
		});
	}
}

export class BriefIngredientsResponse {
	public id: number;
	public name: string;
	public icon: string | null;
	public userAlergic: number;

	constructor(
		ingredient: ingredients & {
			_count: {
				allergicUsers: number;
			};
		}
	) {
		this.id = ingredient.id;
		this.name = ingredient.name;
		this.icon = ingredient.icon;
		this.userAlergic = ingredient._count.allergicUsers;
	}
}

export class GetFoodsResponse {
	public foods: BriefFoodsResponse[];
	public meta: {
		page: number;
		limit: number;
		total: number;
	};

	constructor(
		foods: {
			id: number;
			externalId: string | null;
			name: string;
			ingredients: (ingredients & {
				_count: {
					allergicUsers: number;
				};
			})[];
			createdAt: Date;
			updatedAt: Date;
			deletedAt: Date | null;
			picture: string;
		}[],
		meta: {
			page: number;
			limit: number;
			total: number;
		}
	) {
		this.foods = foods.map((food) => {
			return new BriefFoodsResponse(food);
		});
		this.meta = meta;
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

export class GetIngredientsResponse {
	public ingredients: IngredientsResponse[];

	public meta: {
		page: number;
		limit: number;
		total: number;
	};

	constructor(
		ingredients: (ingredients & {
			_count: {
				allergicUsers: number;
			};
		})[],
		meta: {
			page: number;
			limit: number;
			total: number;
		}
	) {
		this.ingredients = ingredients.map((ingredient) => {
			return new IngredientsResponse(ingredient);
		});
		this.meta = meta;
	}
}
