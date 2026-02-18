"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const catchAsync_1 = require("../../utils/catchAsync");
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
//1. Register User
AuthController.register = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.AuthService.register(req.body);
    res.status(201).json({
        success: true,
        message: result.message,
        data: result
    });
}));
//2. Verify Email
AuthController.verifyEmail = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.AuthService.verifyEmail(req.body);
    res.status(200).json({
        success: true,
        message: result.message,
        token: result.token
    });
}));
// 3. Login
AuthController.login = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield auth_service_1.AuthService.login(req.body);
    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
    });
}));
// 4. Select Club
AuthController.selectClub = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // req.user is guaranteed by the 'protect' middleware
    // We use the exclamation mark (!) because TypeScript might complain it's undefined
    const userId = req.user.id;
    const { club } = req.body;
    const updatedUser = yield auth_service_1.AuthService.selectClub(userId, club);
    res.status(200).json({
        success: true,
        message: `Welcome to ${updatedUser.club}!`,
        data: { club: updatedUser.club }
    });
}));
