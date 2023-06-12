import { IsNotEmpty } from "class-validator";

export class PaginationRequest {
	@IsNotEmpty()
	public page: number;

	@IsNotEmpty()
	public limit: number;
}
