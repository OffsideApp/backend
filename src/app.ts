import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import Routes
import authRoutes from './modules/auth/auth.routes';

// Import Error Handling
import { globalErrorHandler } from './middleware/error.middleware';
import { AppError } from './utils/AppError';

const app = express();

// 1. GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Allow Cross-Origin requests (so React Native can talk to Backend)
app.use(cors());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// 2. ROUTES
app.use('/api/auth', authRoutes);

// Health Check (To see if server is alive)
app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Offside Backend is Live! ⚽️' });
});

// 3. UNHANDLED ROUTES (404)
// If a request gets here, it means no route matched above
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4. GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

export default app;