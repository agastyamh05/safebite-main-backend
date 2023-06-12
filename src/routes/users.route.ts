import { Router } from "express";
import { UserController } from "../controllers/users.controller";
import {
	LogInRequest,
	SignUpRequest,
	RefreshTokenRequest,
	VerifyOTPRequest,
	SendOtpRequest,
	PasswordResetRequest,
    UpdateProfileRequest,
    UpdateAuthRequest,
} from "../dtos/user.request.dto";
import { Routes } from "../utils/interfaces/routers.interface";
import { BodyValidationMiddleware } from "../utils/middlewares/validation.middleware";
import { AuthMiddleware } from "../utils/middlewares/auth.middleware";
import { multerMiddleware } from "../utils/middlewares/multipart.middleware";

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
			BodyValidationMiddleware(SignUpRequest),
			this.userController.signup
		);
		this.router.post(
			`${this.path}/activate`,
			BodyValidationMiddleware(VerifyOTPRequest),
			this.userController.activateAccount
		);
		this.router.post(
			`${this.path}/activate/send`,
			BodyValidationMiddleware(SendOtpRequest),
			this.userController.sendActivationOTP
		);
		this.router.post(
			`${this.path}/login`,
			BodyValidationMiddleware(LogInRequest),
			this.userController.login
		);
		this.router.post(
			`${this.path}/reset-password/send`,
			BodyValidationMiddleware(SendOtpRequest),
			this.userController.sendResetPasswordOTP
		);
		this.router.post(
			`${this.path}/reset-password/verify`,
			BodyValidationMiddleware(VerifyOTPRequest),
			this.userController.getResetPasswordToken
		);
		this.router.post(
			`${this.path}/reset-password`,
			BodyValidationMiddleware(PasswordResetRequest),
			this.userController.resetPassword
		);
		this.router.post(
			`${this.path}/refresh`,
			BodyValidationMiddleware(RefreshTokenRequest),
			this.userController.refreshToken
		);
		this.router.post(
			`${this.path}/logout`,
			AuthMiddleware([], true),
			this.userController.logout
		);
		this.router.get(
			`${this.path}/`,
			AuthMiddleware([], true),
			this.userController.getUserDetail
		);
		this.router.post(
			`${this.path}/profile/upload`,
			AuthMiddleware([], true),
			multerMiddleware.single("file"),
			this.userController.updateUserPicture
		);
		this.router.patch(
			`${this.path}/profile`,
			AuthMiddleware([], true),
            BodyValidationMiddleware(UpdateProfileRequest),
			this.userController.updateProfile
		);
		this.router.patch(
			`${this.path}/`,
			AuthMiddleware([], true, true),
            BodyValidationMiddleware(UpdateAuthRequest),
			this.userController.updateAuthDetail
		);
	}
}
