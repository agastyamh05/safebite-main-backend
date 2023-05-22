import { NextFunction, Request, Response } from 'express';
import { HttpException } from '../exceptions/httpException';
import { logger } from '../logger/logger';


export const ErrorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
    try {
      const status: number = error.status || 500;
      const message: string = error.message || 'Something went wrong';
  
      logger.error(`${req.method} ${req.path} ${status} Message: ${message}`);
      res.status(status).json({ statusCode: error.statusCode, message, errors: error.errors });
    } catch (error) {
      next(error);
    }
  };
  