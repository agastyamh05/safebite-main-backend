import {
	IsString,
	IsNotEmpty,
	MinLength,
	IsNumber,
	IsOptional,
	IsBoolean,
} from "class-validator";
import { PaginationRequest } from "./common.request.dto";

export class GetFoodRequest {
	public id: number;
	public userId?: string;
}

export class GetFoodsRequest extends PaginationRequest {
	public id?: number;

	public externalId?: string;

	public name?: string;
}

export class CreateFoodRequest {
	@IsOptional()
	public externalId: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	public name: string;

	@IsString()
	@IsNotEmpty()
	public picture: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	public description: string;

	@IsNumber({}, { each: true })
	@IsNotEmpty()
	public ingredients: number[];
}

export class CreateIngredientRequest {
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	public name: string;

	@IsOptional()
	@IsString()
	public icon?: string;

	@IsOptional()
	@IsBoolean()
	public isMainAlergen?: boolean;
}
