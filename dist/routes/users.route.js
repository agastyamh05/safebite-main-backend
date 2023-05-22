"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRoute = void 0;
const express_1 = require("express");
const users_controller_1 = require("../controllers/users.controller");
const users_dto_1 = require("../dtos/users.dto");
const validation_middleware_1 = require("../utils/middlewares/validation.middleware");
class UsersRoute {
    constructor() {
        this.path = "";
        this.router = (0, express_1.Router)();
        this.userController = new users_controller_1.UserController();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.path}/signup`, (0, validation_middleware_1.ValidationMiddleware)(users_dto_1.SignUpRequest), this.userController.signup);
        this.router.post(`${this.path}/login`, (0, validation_middleware_1.ValidationMiddleware)(users_dto_1.LogInRequest), this.userController.login);
    }
}
exports.UsersRoute = UsersRoute;
