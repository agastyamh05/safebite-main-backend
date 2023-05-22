"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationMiddleware = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const httpException_1 = require("../exceptions/httpException");
require("../const/const");
const const_1 = require("../const/const");
/**
 * @name ValidationMiddleware
 * @description Allows use of decorator and non-decorator based validation
 * @param type dto
 * @param skipMissingProperties When skipping missing properties
 * @param whitelist Even if your object is an instance of a validation class it can contain additional properties that are not defined
 * @param forbidNonWhitelisted If you would rather to have an error thrown when any non-whitelisted properties are present
 */
const ValidationMiddleware = (type, skipMissingProperties = false, whitelist = false, forbidNonWhitelisted = false) => {
    return (req, res, next) => {
        const dto = (0, class_transformer_1.plainToInstance)(type, req.body);
        (0, class_validator_1.validateOrReject)(dto, {
            skipMissingProperties,
            whitelist,
            forbidNonWhitelisted,
        })
            .then(() => {
            req.body = dto;
            next();
        })
            .catch((errors) => {
            const errorValue = [];
            const fields = [];
            errors.forEach((error) => {
                const constraints = error.constraints;
                fields.push(error.property);
                if (constraints) {
                    const fieldError = [];
                    Object.keys(constraints).forEach((key) => {
                        fieldError.push(constraints[key]);
                    });
                    errorValue.push({
                        field: error.property,
                        message: fieldError,
                    });
                }
            });
            const message = fields.reduce((prev, curr, index) => {
                if (index === 0) {
                    return curr;
                }
                else if (index === fields.length - 1) {
                    return prev + " and " + curr;
                }
                else {
                    return prev + ", " + curr;
                }
            }, "") + " field is invalid";
            next(new httpException_1.HttpException(400, const_1.VALIDATION_ERRORS, message, errorValue));
        });
    };
};
exports.ValidationMiddleware = ValidationMiddleware;
