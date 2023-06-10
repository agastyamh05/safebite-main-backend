import {
	IsString,
	IsNotEmpty,
	MinLength,
	IsNumber,
	IsOptional,
} from "class-validator";

export class GetFoodRequest {
	public id: number;
	public userId?: string;
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

	@IsNumber()
	@IsNotEmpty()
	public ingredients: number[];
}
