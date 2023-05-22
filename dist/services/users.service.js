"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const uuid_1 = require("uuid");
const httpException_1 = require("../utils/exceptions/httpException");
const bcrypt_1 = require("bcrypt");
const typedi_1 = require("typedi");
const const_1 = require("../utils/const/const");
const config_1 = require("../utils/config/config");
const prisma_1 = __importDefault(require("../utils/driver/prisma"));
const parse_duration_1 = __importDefault(require("parse-duration"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let UsersService = class UsersService {
    async signup(data) {
        const storedUser = await prisma_1.default.users.findUnique({
            where: { email: data.email },
        });
        if (storedUser) {
            throw new httpException_1.HttpException(409, const_1.BUSINESS_LOGIC_ERRORS, "user already exists", [
                {
                    field: "email",
                    message: ["email already exists"],
                },
            ]);
        }
        const hashedPassword = await (0, bcrypt_1.hash)(data.password, 10);
        await prisma_1.default.users.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
            },
        });
        return;
    }
    async login(data, meta) {
        const storedUser = await prisma_1.default.users.findUnique({
            where: { email: data.email },
        });
        const commonError = [
            {
                field: "email",
                message: ["invalid credentials provided"],
            },
            {
                field: "password",
                message: ["invalid credentials provided"],
            },
        ];
        if (!storedUser) {
            throw new httpException_1.HttpException(401, const_1.BUSINESS_LOGIC_ERRORS, "invalid credentials", commonError);
        }
        const isPasswordCorrect = await (0, bcrypt_1.compare)(data.password, storedUser.password);
        if (!isPasswordCorrect) {
            throw new httpException_1.HttpException(401, const_1.BUSINESS_LOGIC_ERRORS, "invalid credentials", commonError);
        }
        // deactive all other sessions with the same device
        async () => {
            if (meta.deviceId) {
                await prisma_1.default.sessions.updateMany({
                    where: {
                        userId: storedUser.id,
                        isActive: true,
                        deviceId: meta.deviceId,
                    },
                    data: {
                        isActive: false,
                    },
                });
            }
        };
        // uuid session key
        const key = (0, uuid_1.v4)();
        const accessTokenExpiresAt = Date.now() + (0, parse_duration_1.default)(config_1.ACCESS_TOKEN_EXPIRES_IN);
        const refreshTokenExpiresAt = Date.now() + (0, parse_duration_1.default)(config_1.REFRESH_TOKEN_EXPIRES_IN);
        // create session
        await prisma_1.default.sessions.create({
            data: {
                user: {
                    connect: {
                        id: storedUser.id
                    }
                },
                deviceId: meta.deviceId,
                deviceName: meta.deviceName,
                ip: meta.ip,
                key: key,
                expiresAt: new Date(Date.now() + (0, parse_duration_1.default)(config_1.REFRESH_TOKEN_EXPIRES_IN)),
            },
        });
        const accessToken = jsonwebtoken_1.default.sign({
            uid: storedUser.id,
            sessionKey: key,
            category: "access",
            isFresh: true,
            exp: accessTokenExpiresAt,
        }, config_1.ACCESS_TOKEN_SECRET);
        const refreshToken = jsonwebtoken_1.default.sign({
            uid: storedUser.id,
            sessionKey: key,
            category: "refresh",
            exp: refreshTokenExpiresAt,
        }, config_1.REFRESH_TOKEN_SECRET);
        return {
            uuid: storedUser.id,
            access: {
                token: accessToken,
                expiredAt: accessTokenExpiresAt,
            },
            refresh: {
                token: refreshToken,
                expiredAt: refreshTokenExpiresAt,
            },
        };
    }
};
UsersService = __decorate([
    (0, typedi_1.Service)()
], UsersService);
exports.UsersService = UsersService;
