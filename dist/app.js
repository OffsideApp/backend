"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
// Import Routes
const auth_route_1 = __importDefault(require("./modules/auth/auth.route"));
// Import Error Handling
const error_middleware_1 = require("./middleware/error.middleware");
const AppError_1 = require("./utils/AppError");
const app = (0, express_1.default)();
// 1. GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use((0, helmet_1.default)());
// Development logging
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Allow Cross-Origin requests (so React Native can talk to Backend)
app.use((0, cors_1.default)());
// Body parser, reading data from body into req.body
app.use(express_1.default.json({ limit: '10kb' }));
// 2. ROUTES
app.use('/api/v1/auth', auth_route_1.default);
// Health Check (To see if server is alive)
app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Offside Backend is Live! ⚽️' });
});
// 3. UNHANDLED ROUTES (404)
// If a request gets here, it means no route matched above
app.all('*', (req, res, next) => {
    next(new AppError_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// 4. GLOBAL ERROR HANDLER
app.use(error_middleware_1.globalErrorHandler);
exports.default = app;
