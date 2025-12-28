import express from 'express';
import { getCompanyBalance, getAllCompanies } from '../controllers/company.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/balance', authenticateToken, getCompanyBalance);
router.get('/list', authenticateToken, getAllCompanies);

export default router;
