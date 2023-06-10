import { IsNotEmpty, IsNumber } from "class-validator";

export class PaginationRequest {
	@IsNotEmpty()
	@IsNumber()
	public page: number;

	@IsNotEmpty()
	@IsNumber()
	public limit: number;
}
