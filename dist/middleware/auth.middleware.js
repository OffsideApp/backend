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
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../libs/prisma");
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
/**
 * 🛡️ Protect: Verifies the JWT Token
 */
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    // 1. Check for Authorization Header
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get the token from "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];
            // 2. Verify Token
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // 3. ROBUST CHECK: Does this user still exist?
            // (This handles cases where a user is deleted but token is still valid)
            const currentUser = yield prisma_1.prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, role: true, isVerified: true } // Fetch only needed fields
            });
            if (!currentUser) {
                return res.status(401).json({
                    success: false,
                    message: 'The user belonging to this token no longer exists.'
                });
            }
            // 4. Attach User to Request Object
            req.user = {
                id: currentUser.id,
                role: currentUser.role
            };
            next(); // Move to the next middleware/controller
        }
        catch (error) {
            console.error('Auth Error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
});
exports.protect = protect;
/**
 * 👑 Authorize: Restricts access to specific roles (e.g., ADMIN)
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        var _a;
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${(_a = req.user) === null || _a === void 0 ? void 0 : _a.role}' is not authorized to access this route`
            });
        }
        next();
    };
};
exports.authorize = authorize;
