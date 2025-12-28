import db from '../config/database.js';
import * as models from '../models/models.js';

export const getCompanyRequests = async (req, res) => {
  try {
    const requests = await models.getCompanyRequests(req.user.companyId);
    res.json(requests.map(r => ({ 
      ...r, 
      recipient: { name: r.recipient_name } 
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReceivedRequests = async (req, res) => {
  try {
    const requests = await models.getReceivedRequests(req.user.companyId);
    res.json(requests.map(r => ({ 
      ...r, 
      requestor: { name: r.requestor_name } 
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createRequest = async (req, res) => {
  try {
    const { recipientId, type, price, quantity, reason } = req.body;
    const request = await models.createRequest({ 
      requestorId: req.user.companyId, 
      recipientId, 
      type, 
      price, 
      quantity, 
      reason 
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientId, type, price, quantity, reason } = req.body;
    const existing = await models.findRequestById(parseInt(id));
    
    if (!existing || existing.requestorId !== req.user.companyId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const updates = {};
    if (recipientId) updates.recipientId = recipientId;
    if (type) updates.type = type;
    if (price) updates.price = price;
    if (quantity) updates.quantity = quantity;
    if (reason !== undefined) updates.reason = reason;
    
    await models.updateRequest(parseInt(id), updates);
    res.json({ message: 'Request updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await models.findRequestById(parseInt(id));
    
    if (!existing || existing.requestorId !== req.user.companyId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await models.deleteRequest(parseInt(id));

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Transaction processing helper
const processSingleTransaction = async (requestId, userCompanyId, action) => {
  const request = await models.getRequestWithBalances(requestId);
  if (!request || request.recipientId !== userCompanyId) {
    throw new Error('Not authorized');
  }
  if (request.status !== 'PENDING') {
    throw new Error('Already processed');
  }

  if (action === 'REJECT') {
    await models.updateRequest(parseInt(requestId), { status: 'REJECTED' });
    return;
  }

  const totalCost = request.price * request.quantity;
  const isBuy = request.type === 'BUY';
  const requestorCarbonChange = isBuy ? request.quantity : -request.quantity;
  const requestorCashChange = isBuy ? -totalCost : totalCost;
  const recipientCarbonChange = -requestorCarbonChange;
  const recipientCashChange = -requestorCashChange;

  if (request.recipient_carbonBalance + recipientCarbonChange < 0 || 
      request.recipient_cashBalance + recipientCashChange < 0) {
    throw new Error('Insufficient balance');
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    await connection.query(
      "UPDATE OutstandingRequest SET status = ? WHERE id = ?", 
      ['ACCEPTED', parseInt(requestId)]
    );
    
    await connection.query(
      "UPDATE CompanyAccountBalance SET carbonBalance = carbonBalance + ?, cashBalance = cashBalance + ? WHERE companyId = ?", 
      [requestorCarbonChange, requestorCashChange, request.requestorId]
    );
    
    await connection.query(
      "UPDATE CompanyAccountBalance SET carbonBalance = carbonBalance + ?, cashBalance = cashBalance + ? WHERE companyId = ?", 
      [recipientCarbonChange, recipientCashChange, request.recipientId]
    );
    
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const processRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    await processSingleTransaction(id, req.user.companyId, action);
    res.json({ message: `Request ${action.toLowerCase()}ed successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkProcessRequests = async (req, res) => {
  try {
    const { requestIds, action } = req.body;
    const results = { successful: [], failed: [] };

    for (const requestId of requestIds) {
      try {
        await processSingleTransaction(requestId, req.user.companyId, action);
        results.successful.push({ id: requestId, action });
      } catch (error) {
        results.failed.push({ id: requestId, reason: error.message });
      }
    }

    res.json({ message: 'Bulk processing completed', results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
