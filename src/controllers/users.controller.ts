import { NextFunction, Request, Response } from "express";
import { Container } from "typedi";
import { UsersService } from "../services/users.service";
import { SUCCESS, VALIDATION_ERRORS } from "../utils/const/errorCodes";
import { HttpException } from "../utils/exceptions/httpException";

export class UserController {
	private userService: UsersService = Container.get(UsersService);

	public signup = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const createdUserResponse = await this.userService.signup(req.body);
			res.status(201).json({
				statusCode: SUCCESS,
				message: "user created",
				data: createdUserResponse,
			});
		} catch (error) {
			next(error);
		}
	};

	public sendActivationOTP = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			await this.userService.sendActivationOTP({
				...req.body,
				purpose: "activation",
			});
			res.status(200).json({
				statusCode: SUCCESS,
				message: "otp sent",
			});
		} catch (error) {
			next(error);
		}
	};

	public activateAccount = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			await this.userService.verifyActivationOTP(req.body);
			res.status(200).json({
				statusCode: SUCCESS,
				message: "account activated",
			});
		} catch (error) {
			next(error);
		}
	};

	public login = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const tokenResponse = await this.userService.login(req.body, {
				deviceId: req.headers["x-device-id"] as string,
				deviceName: req.headers["x-device"] as string,
				ip: req.ip,
			});
			res.status(200).json({
				statusCode: SUCCESS,
				message: "user logged in",
				data: tokenResponse,
			});
		} catch (error) {
			next(error);
		}
	};

	public sendResetPasswordOTP = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			await this.userService.sendPasswordResetOTP({
				...req.body,
				purpose: "passwordReset",
			});
			res.status(200).json({
				statusCode: SUCCESS,
				message: "otp sent",
			});
		} catch (error) {
			next(error);
		}
	};

	public getResetPasswordToken = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const tokenResponse = await this.userService.verifyResetPasswordOTP(
				req.body
			);
			res.status(200).json({
				statusCode: SUCCESS,
				message: "otp verified",
				data: tokenResponse,
			});
		} catch (error) {
			next(error);
		}
	};

	public resetPassword = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			await this.userService.resetPassword(req.body);
			res.status(200).json({
				statusCode: SUCCESS,
				message: "success resetting password",
			});
		} catch (error) {
			next(error);
		}
	};

	public refreshToken = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const tokenResponse = await this.userService.refreshTokens(
				req.body,
				{
					deviceId: req.headers["x-device-id"] as string,
					deviceName: req.headers["x-device"] as string,
					ip: req.ip,
				}
			);
			res.status(200).json({
				statusCode: SUCCESS,
				message: "token refreshed",
				data: tokenResponse,
			});
		} catch (error) {
			next(error);
		}
	};

	public logout = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			await this.userService.logout(res.locals.token);
			res.status(200).json({
				statusCode: SUCCESS,
				message: "user logged out",
			});
		} catch (error) {
			next(error);
		}
	};

	public getUserDetail = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const user = await this.userService.getUserDetail({
				id: res.locals.user.uid as string,
			});
			res.status(200).json({
				statusCode: SUCCESS,
				message: "success retrieve user",
				data: user,
			});
		} catch (error) {
			next(error);
		}
	};

	public updateUserPicture = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			const file = req.file;
			if (!file) {
				throw new HttpException(
					400,
					VALIDATION_ERRORS,
					"file is required",
					[
						{
							field: "file",
							message: ["file is required"],
						},
					]
				);
			}

			// validate file type
			const fileType = file.mimetype.split("/")[0];
			if (fileType !== "image") {
				throw new HttpException(
					400,
					VALIDATION_ERRORS,
					"file type must be image",
					[
						{
							field: "file",
							message: ["file type must be image"],
						},
					]
				);
			}

			// const supportedFileTypes = ["jpg", "jpeg", "png"];
			// // validate file type from extension and buffer
			// const fileExtension = file.originalname.split(".").pop();
			// if (!fileExtension || !supportedFileTypes.includes(fileExtension)) {
			// 	throw new HttpException(
			// 		400,
			// 		VALIDATION_ERRORS,
			// 		"file type is not supported"
			// 	);
			// }

			await this.userService.updatePicture({
				id: res.locals.user.uid as string,
				picture: file,
			});

			res.status(200).json({
				statusCode: SUCCESS,
				message: "success update user picture",
			});
		} catch (error) {
			next(error);
		}
	};

	public updateProfile = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			await this.userService.updateProfile({
				id: res.locals.user.uid as string,
				...req.body,
			});
			res.status(200).json({
				statusCode: SUCCESS,
				message: "success update user detail",
			});
		} catch (error) {
			next(error);
		}
	};

	public updateAuthDetail = async (
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> => {
		try {
			await this.userService.updateAuth({
				id: res.locals.user.uid as string,
				...req.body,
			});
			res.status(200).json({
				statusCode: SUCCESS,
				message: "success change authentication detail",
			});
		} catch (error) {
			next(error);
		}
	};
}
