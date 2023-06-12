import "reflect-metadata";
import express from "express";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import { Routes } from "./utils/interfaces/routers.interface";
import { ErrorMiddleware } from "./utils/middlewares/error.middleware";
import {
	NODE_ENV,
	PORT,
	ORIGIN,
	CREDENTIALS,
	LOG_FORMAT,
} from "./utils/config/config";
import { logger, stream } from "./utils/logger/logger";

export class App {
	public app: express.Application;
	public env: string;
	public port: string | number;
    public prefix: string;

	constructor(prefix: string, routes: Routes[]) {
		this.app = express();
		this.env = NODE_ENV || "development";
		this.port = PORT || 3000;
        this.prefix = prefix; 
        
		this.initializeMiddlewares();
		this.initializeRoutes(routes);
		this.initializeErrorHandling();
	}

	public listen() {
		this.app.listen(this.port, () => {
			logger.info(`🚀 App listening at http://localhost:${this.port}`);
		});
	}

	private initializeMiddlewares() {
		this.app.use(morgan(LOG_FORMAT, { stream }));
		this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
		this.app.use(compression());
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: true }));
	}

	private initializeRoutes(routes: Routes[]) {
		routes.forEach((route) => {
            this.app.use(this.prefix, route.router);
		});
	}

	private initializeErrorHandling() {
		this.app.use(ErrorMiddleware);
	}
}