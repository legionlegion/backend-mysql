import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import companyRoutes from './routes/company.routes.js';
import requestRoutes from './routes/request.routes.js';

const app = express();
const PORT = process.env.PORT;

// CORS must come BEFORE helmet
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json());
app.use(cookieParser());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

app.get('/', (req, res) => {
  res.send('DBS App API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/requests', requestRoutes);

// Global error handler (must be AFTER routes)
app.use((err, req, res, next) => {
  console.error("!!! GLOBAL ERROR HANDLER !!!");
  console.error("Time:", new Date().toISOString());
  console.error("Request:", req.method, req.url);
  console.error("Error Message:", err.message);
  console.error("Error Stack:", err.stack);
  console.error("Error Code:", err.code);
  console.error("Error SQL:", err.sql);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Export app for testing
export default app;


app.listen(PORT, () => {
  console.log(`DBS Backend at Port ${PORT}`)
})

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});
