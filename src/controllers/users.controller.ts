import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { UsersService } from '../services/users.service';
import { SUCCESS } from '../utils/const/const';

export class UserController {
    private userService: UsersService = Container.get(UsersService);

    public signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const createdUserResponse = await this.userService.signup(req.body);
            res.status(201).json({ statusCode: SUCCESS, message: 'user created', data: createdUserResponse });
        } catch (error) {
            next(error);
        }
    };

    public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tokenResponse = await this.userService.login(req.body, {
                deviceId: req.headers['x-device-id'] as string,
                deviceName: req.headers['x-device'] as string,
                ip : req.ip
            });
            res.status(200).json({ statusCode: SUCCESS, message: 'user logged in', data: tokenResponse });
        } catch (error) {
            next(error);
        }
    }

    public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const tokenResponse = await this.userService.refreshTokens(req.body,{
                deviceId: req.headers['x-device-id'] as string,
                deviceName: req.headers['x-device'] as string,
                ip : req.ip
            });
            res.status(200).json({ statusCode: SUCCESS, message: 'token refreshed', data: tokenResponse });
        } catch (error) {
            next(error);
        }
    }
}