import { Router } from "express";
import { UserController } from "../controllers/users.controller";
import {
	LogInRequest,
	SignUpRequest,
	RefreshTokenRequest,
} from "../dtos/users.dto";
import { Routes } from "../utils/interfaces/routers.interface";
import { ValidationMiddleware } from "../utils/middlewares/validation.middleware";
import { AuthMiddleware } from "../utils/middlewares/auth.middleware";

export class UsersRoute implements Routes {
	public path = "/users";
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
		this.router.post(
			`${this.path}/refresh`,
			ValidationMiddleware(RefreshTokenRequest),
			this.userController.refreshToken
		);
		this.router.post(
			`${this.path}/logout`,
			AuthMiddleware, 
			this.userController.logout
		);
        this.router.get(
            `${this.path}/`,
            AuthMiddleware,
            this.userController.getUserInfo
        );
	}
}
