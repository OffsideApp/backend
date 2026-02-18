"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const client_1 = require("../../src/generated/prisma/client");
const globalErrorHandler = (err, req, res, next) => {
    var _a;
    // Default values
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    // ------------------------------------------
    // 🛡️ CUSTOM ERROR HANDLING LOGIC
    // ------------------------------------------
    // 1. Handle Prisma Unique Constraint Violations (e.g. Duplicate Email)
    // Code P2002 means "Unique constraint failed"
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const fields = ((_a = err.meta) === null || _a === void 0 ? void 0 : _a.target) || ['field'];
            const message = `Duplicate value for field: ${fields.join(', ')}. Please use another value.`;
            err = new AppError_1.AppError(message, 400);
        }
    }
    // 2. Handle JWT Errors
    if (err.name === 'JsonWebTokenError') {
        err = new AppError_1.AppError('Invalid token. Please log in again.', 401);
    }
    if (err.name === 'TokenExpiredError') {
        err = new AppError_1.AppError('Your token has expired. Please log in again.', 401);
    }
    // ------------------------------------------
    // 📤 SEND RESPONSE
    // ------------------------------------------
    // Development: Send full stack trace
    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            success: false,
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    // Production: Don't leak stack traces to users
    else {
        // Trusted Operational Error? Send message to client.
        if (err.isOperational) {
            res.status(err.statusCode).json({
                success: false,
                status: err.status,
                message: err.message
            });
        }
        // Programming or Unknown Error? Don't leak details.
        else {
            console.error('ERROR 💥', err); // Log to server console
            res.status(500).json({
                success: false,
                status: 'error',
                message: 'Something went very wrong!'
            });
        }
    }
};
exports.globalErrorHandler = globalErrorHandler;
