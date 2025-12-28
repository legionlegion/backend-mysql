import db from '../config/database.js';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('Starting seed...');

    // Create companies and their balances
    const companies = [
      { name: 'Green Energy Corp', carbon: 1500, cash: 50000 },
      { name: 'Eco Solutions Ltd', carbon: 2000, cash: 75000 },
      { name: 'Carbon Neutral Inc', carbon: 1000, cash: 60000 }
    ];

    const companyIds = [];
    
    for (const company of companies) {
      // Check if company exists
      const [existing] = await db.query(
        'SELECT id FROM Company WHERE name = ?',
        [company.name]
      );

      let companyId;
      if (existing.length > 0) {
        companyId = existing[0].id;
        console.log(`Company "${company.name}" already exists with ID ${companyId}`);
      } else {
        // Create company
        const [result] = await db.query(
          'INSERT INTO Company (name, created_at) VALUES (?, NOW())',
          [company.name]
        );
        companyId = result.insertId;
        console.log(`Created company: ${company.name} with ID ${companyId}`);

        // Create balance for new company
        await db.query(
          'INSERT INTO CompanyAccountBalance (companyId, carbonBalance, cashBalance) VALUES (?, ?, ?)',
          [companyId, company.carbon, company.cash]
        );
        console.log(`Created balance for ${company.name}`);
      }
      
      companyIds.push(companyId);
    }

    // Create users
    const password = await bcrypt.hash('password123', 10);
    
    const users = [
      { name: 'John Doe', email: 'john@greenenergy.com', companyId: companyIds[0] },
      { name: 'Jane Smith', email: 'jane@ecosolutions.com', companyId: companyIds[1] },
      { name: 'Bob Johnson', email: 'bob@carbonneutral.com', companyId: companyIds[2] }
    ];

    for (const user of users) {
      // Check if user exists
      const [existing] = await db.query(
        'SELECT id FROM User WHERE email = ?',
        [user.email]
      );

      if (existing.length === 0) {
        await db.query(
          'INSERT INTO User (name, email, password_hash, companyId, created_at) VALUES (?, ?, ?, ?, NOW())',
          [user.name, user.email, password, user.companyId]
        );
        console.log(`Created user: ${user.email}`);
      } else {
        console.log(`User ${user.email} already exists`);
      }
    }

    // Create some sample requests
    const requests = [
      {
        requestorId: companyIds[0],
        recipientId: companyIds[1],
        type: 'BUY',
        price: 50,
        quantity: 100,
        reason: 'Need carbon credits for Q4 compliance'
      },
      {
        requestorId: companyIds[1],
        recipientId: companyIds[2],
        type: 'SELL',
        price: 48,
        quantity: 150,
        reason: 'Excess credits available'
      }
    ];

    for (const request of requests) {
      // Check if similar request exists
      const [existing] = await db.query(
        'SELECT id FROM OutstandingRequest WHERE requestorId = ? AND recipientId = ? AND type = ? AND status = "PENDING"',
        [request.requestorId, request.recipientId, request.type]
      );

      if (existing.length === 0) {
        await db.query(
          'INSERT INTO OutstandingRequest (requestorId, recipientId, type, price, quantity, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, "PENDING", NOW(), NOW())',
          [request.requestorId, request.recipientId, request.type, request.price, request.quantity, request.reason]
        );
        console.log(`Created request from company ${request.requestorId} to ${request.recipientId}`);
      } else {
        console.log(`Similar request already exists`);
      }
    }

    console.log('Seed completed successfully!');
    console.log('\nTest credentials:');
    console.log('Email: john@greenenergy.com | Password: password123');
    console.log('Email: jane@ecosolutions.com | Password: password123');
    console.log('Email: bob@carbonneutral.com | Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
