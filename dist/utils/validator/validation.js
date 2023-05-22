"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const httpException_1 = require("../exceptions/httpException");
require("../const/const");
const const_1 = require("../const/const");
const validate = (type, req, skipMissingProperties = false, whitelist = false, forbidNonWhitelisted = false) => {
    const dto = (0, class_transformer_1.plainToInstance)(type, req);
    (0, class_validator_1.validateOrReject)(dto, {
        skipMissingProperties,
        whitelist,
        forbidNonWhitelisted,
    })
        .catch((errors) => {
        const message = [];
        errors.forEach((error) => {
            const constraints = error.constraints;
            if (constraints) {
                const fieldError = [];
                Object.keys(constraints).forEach((key) => {
                    fieldError.push(constraints[key]);
                });
                message.push({
                    field: error.property,
                    message: fieldError,
                });
            }
        });
        throw new httpException_1.HttpException(400, const_1.VALIDATION_ERRORS, message);
    });
};
exports.validate = validate;
