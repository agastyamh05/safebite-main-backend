"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const error_middleware_1 = require("./utils/middlewares/error.middleware");
const config_1 = require("./utils/config/config");
const logger_1 = require("./utils/logger/logger");
class App {
    constructor(routes) {
        this.app = (0, express_1.default)();
        this.env = config_1.NODE_ENV || "development";
        this.port = config_1.PORT || 3000;
        this.initializeMiddlewares();
        this.initializeRoutes(routes);
        this.initializeErrorHandling();
    }
    listen() {
        this.app.listen(this.port, () => {
            logger_1.logger.info(`🚀 App listening at http://localhost:${this.port}`);
        });
    }
    initializeMiddlewares() {
        this.app.use((0, morgan_1.default)(config_1.LOG_FORMAT, { stream: logger_1.stream }));
        this.app.use((0, cors_1.default)({ origin: config_1.ORIGIN, credentials: config_1.CREDENTIALS }));
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
    }
    initializeRoutes(routes) {
        routes.forEach((route) => {
            this.app.use("/", route.router);
        });
    }
    initializeErrorHandling() {
        this.app.use(error_middleware_1.ErrorMiddleware);
    }
}
exports.App = App;
