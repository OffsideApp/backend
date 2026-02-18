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
const dotenv_1 = __importDefault(require("dotenv"));
// Load env vars BEFORE importing app
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 5000;
// Start Server
const server = app_1.default.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`\n⚽️  OFFSIDE SERVER STARTED  ⚽️`);
    console.log(`🚀  Listening on port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    // Test Database Connection
    //   try {
    //     await prisma.$connect();
    //     console.log('✅  Database Connected Successfully');
    //   } catch (error) {
    //     console.error('❌  Database Connection Failed:', error);
    //   }
    // });
    // Handle Unhandled Rejections (e.g. Database crashes)
    process.on('unhandledRejection', (err) => {
        console.log('UNHANDLED REJECTION! 💥 Shutting down...');
        console.log(err.name, err.message);
        server.close(() => {
            process.exit(1);
        });
    });
}));
