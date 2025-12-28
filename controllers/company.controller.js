import db from '../config/database.js';
import * as models from '../models/models.js';

export const getCompanyBalance = async (req, res) => {
  try {
    const company = await models.findCompanyById(req.user.companyId);
    const balance = await models.findBalanceByCompanyId(req.user.companyId);
    
    res.json({ 
      companyName: company.name, 
      carbonBalance: balance?.carbonBalance || 0, 
      cashBalance: balance?.cashBalance || 0 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await models.getAllCompaniesExcept(req.user.companyId);
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

