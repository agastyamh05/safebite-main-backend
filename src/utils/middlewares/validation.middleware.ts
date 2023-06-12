/* eslint-disable @typescript-eslint/no-explicit-any */
import { plainToInstance } from "class-transformer";
import { validateOrReject, ValidationError } from "class-validator";
import { NextFunction, Request, Response } from "express";
import { ErrorValue, HttpException } from "../exceptions/httpException";
import "../const/errorCodes";
import { VALIDATION_ERRORS } from "../const/errorCodes";

/**
 * @name BodyValidationMiddleware
 * @description Allows use of decorator and non-decorator based validation
 * @param type dto
 * @param skipMissingProperties When skipping missing properties
 * @param whitelist Even if your object is an instance of a validation class it can contain additional properties that are not defined
 * @param forbidNonWhitelisted If you would rather to have an error thrown when any non-whitelisted properties are present
 */
export const BodyValidationMiddleware = (
	type: any,
	skipMissingProperties = false,
	whitelist = false,
	forbidNonWhitelisted = false
) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const dto = plainToInstance(type, req.body);
		validateOrReject(dto, {
			skipMissingProperties,
			whitelist,
			forbidNonWhitelisted,
		})
			.then(() => {
				req.body = dto;
				next();
			})
			.catch((errors: ValidationError[]) => {
				const { message, errorValue } = proccessError(errors);
				next(
					new HttpException(
						400,
						VALIDATION_ERRORS,
						message,
						errorValue
					)
				);
			});
	};
};

export const QueryValidationMiddleware = (
	type: any,
	skipMissingProperties = false,
	whitelist = false,
	forbidNonWhitelisted = false
) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const dto = plainToInstance(type, req.query as any);

		validateOrReject(dto, {
			skipMissingProperties,
			whitelist,
			forbidNonWhitelisted,
		})
			.then(() => {
				req.body = dto;
				next();
			})
			.catch((errors: ValidationError[]) => {
				const { message, errorValue } = proccessError(errors);
				next(
					new HttpException(
						400,
						VALIDATION_ERRORS,
						message,
						errorValue
					)
				);
			});
	};
};

const proccessError = (errors: ValidationError[]) => {
	const errorValue: ErrorValue[] = [];
	const fields: string[] = [];
	errors.forEach((error: ValidationError) => {
		const constraints = error.constraints;
		fields.push(error.property);
		if (constraints) {
			const fieldError: string[] = [];
			Object.keys(constraints).forEach((key) => {
				fieldError.push(constraints[key]);
			});
			errorValue.push({
				field: error.property,
				message: fieldError,
			});
		}
	});

	const message =
		fields.reduce((prev, curr, index) => {
			if (index === 0) {
				return curr;
			} else if (index === fields.length - 1) {
				return prev + " and " + curr;
			} else {
				return prev + ", " + curr;
			}
		}, "") + " field is invalid";

	return {
		message,
		errorValue,
	};
};
