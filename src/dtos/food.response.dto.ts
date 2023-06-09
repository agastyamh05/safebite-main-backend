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

export class GetFoodResponse {
	public id: number;
	public name: string;
	public picture: string;
	public externalId: string | null;
	public description: string | null;
	public alergic: IngredientsResponse[];
	public ingredients: IngredientsResponse[];

    constructor( food: foods, ingredients: IngredientsResponse[], alergic: IngredientsResponse[]) {
        this.id = food.id;
        this.name = food.name;
        this.picture = food.picture;
        this.externalId = food.externalId;
        this.description = food.description;
        this.ingredients = ingredients;
        this.alergic = alergic;
    }
}

export class CreateFoodResponse {
    public id: number;

    constructor(food: foods) {
        this.id = food.id;
    }
}