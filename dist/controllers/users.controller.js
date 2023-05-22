"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const typedi_1 = require("typedi");
const users_service_1 = require("../services/users.service");
const const_1 = require("../utils/const/const");
class UserController {
    constructor() {
        this.userService = typedi_1.Container.get(users_service_1.UsersService);
        this.signup = async (req, res, next) => {
            try {
                await this.userService.signup(req.body);
                res.status(201).json({ statusCode: const_1.SUCCESS, message: 'user created' });
            }
            catch (error) {
                next(error);
            }
        };
        this.login = async (req, res, next) => {
            try {
                const tokenResponse = await this.userService.login(req.body, {
                    deviceId: req.headers['x-device-id'],
                    deviceName: req.headers['x-device'],
                    ip: req.ip
                });
                res.status(200).json({ statusCode: const_1.SUCCESS, message: 'user logged in', data: tokenResponse });
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.UserController = UserController;
