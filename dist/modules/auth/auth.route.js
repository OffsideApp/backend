"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// --- PUBLIC ROUTES ---
router.post('/register', auth_controller_1.AuthController.register);
router.post('/verify', auth_controller_1.AuthController.verifyEmail);
router.post('/login', auth_controller_1.AuthController.login);
// --- PROTECTED ROUTES ---
router.post('/select-club', auth_middleware_1.protect, auth_controller_1.AuthController.selectClub);
exports.default = router;
