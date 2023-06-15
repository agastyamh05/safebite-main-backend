import { Router } from "express";
import { Routes } from "../utils/interfaces/routers.interface";
import { CommonController } from "../controllers/common.controller";

export class CommonRoute implements Routes {
	public path = "";
	public router = Router();
	public commonController = new CommonController();

	constructor() {
		this.initializeRoutes();
	}

	private initializeRoutes() {
		this.router.get(
			`${this.path}/health/`,
			this.commonController.getHealth
		);

	}
}
