"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpException = exports.ErrorValue = void 0;
class ErrorValue {
}
exports.ErrorValue = ErrorValue;
class HttpException extends Error {
    constructor(status, statusCode, message, errors) {
        super(message);
        this.status = status;
        this.statusCode = statusCode;
        this.errors = errors;
    }
}
exports.HttpException = HttpException;
