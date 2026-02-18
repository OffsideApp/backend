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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../libs/prisma");
const client_1 = require("../../generated/prisma/client"); // Use standard Prisma import
const AppError_1 = require("../../utils/AppError"); // Import AppError!
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
class AuthService {
    static register(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield prisma_1.prisma.user.findFirst({
                where: { OR: [{ email: dto.email }, { username: dto.username }] },
            });
            if (existingUser) {
                throw new AppError_1.AppError("User already exists", 409);
            }
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(dto.password, salt);
            // Generate OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
            const newUser = yield prisma_1.prisma.user.create({
                data: {
                    username: dto.username,
                    email: dto.email,
                    password: hashedPassword,
                    club: null,
                    reputation: 0,
                    role: client_1.ROLE.USER,
                    isVerified: false,
                    otp: otp,
                    otpExpires: otpExpires
                },
            });
            console.log(`📧 SENDING OTP: ${otp} to ${dto.email}`);
            return {
                userId: newUser.id,
                email: newUser.email,
                message: "Please check your email for the verification code."
            };
        });
    }
    static verifyEmail(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.prisma.user.findUnique({ where: { email: dto.email } });
            if (!user)
                throw new AppError_1.AppError('User not found', 404);
            if (user.isVerified)
                throw new AppError_1.AppError('User is already verified', 400);
            // Check OTP
            if (!user.otp || user.otp !== dto.otp)
                throw new AppError_1.AppError('Invalid OTP', 400);
            if (user.otpExpires && new Date() > user.otpExpires)
                throw new AppError_1.AppError('OTP has expired', 400);
            // Activate User
            yield prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true, otp: null, otpExpires: null }
            });
            // OPTIONAL: Generate token immediately so they don't have to login again
            const token = this.generateToken(user.id, user.club, user.role);
            return { message: "Email verified successfully.", token };
        });
    }
    static login(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield prisma_1.prisma.user.findUnique({ where: { email: dto.email } });
            // Combine User Not Found & Bad Password for security
            if (!user)
                throw new AppError_1.AppError('Invalid credentials', 401);
            if (!user.isVerified)
                throw new AppError_1.AppError('Please verify your email first', 401);
            const isMatch = yield bcryptjs_1.default.compare(dto.password, user.password);
            if (!isMatch)
                throw new AppError_1.AppError('Invalid credentials', 401);
            const token = this.generateToken(user.id, user.club, user.role);
            return {
                userId: user.id,
                email: user.email,
                role: user.role,
                token: token,
                hasSelectedClub: !!user.club
            };
        });
    }
    static selectClub(userId, clubName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.prisma.user.update({
                where: { id: userId },
                data: { club: clubName }
            });
        });
    }
    static generateToken(userId, club, role) {
        return jsonwebtoken_1.default.sign({ id: userId, club: club || "", role: role }, JWT_SECRET, { expiresIn: '7d' });
    }
}
exports.AuthService = AuthService;
