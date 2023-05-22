import { Router } from "express";
import { UserController } from "../controllers/users.controller";
import { LogInRequest, SignUpRequest } from "../dtos/users.dto";
import { Routes } from "../utils/interfaces/routers.interface";
import { ValidationMiddleware } from "../utils/middlewares/validation.middleware";

export class UsersRoute implements Routes {
	public path = "";
	public router = Router();
	public userController = new UserController();

	constructor() {
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.post(
			`${this.path}/signup`,
			ValidationMiddleware(SignUpRequest),
			this.userController.signup
		);
		this.router.post(
			`${this.path}/login`,
			ValidationMiddleware(LogInRequest),
			this.userController.login
		);
	}
}
