"use strict";
// src/utils/AppError.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Marks trusted errors (vs bugs)
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
