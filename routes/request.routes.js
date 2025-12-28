import express from 'express';
import { 
  getCompanyRequests, 
  getReceivedRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  processRequest,
  bulkProcessRequests
} from '../controllers/request.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/made', authenticateToken, getCompanyRequests);
router.get('/received', authenticateToken, getReceivedRequests);
router.post('/', authenticateToken, createRequest);
router.put('/:id', authenticateToken, updateRequest);
router.delete('/:id', authenticateToken, deleteRequest);
router.post('/:id/process', authenticateToken, processRequest);
router.post('/bulk-process', authenticateToken, bulkProcessRequests);

export default router;
