import db from "../config/database.js";

// User Models
export async function findUserByEmail(email) {
  const [rows] = await db.query(
    "SELECT * FROM User WHERE email = ?",
    [email]
  );
  return rows[0];
}

export async function findUserById(id) {
  const [rows] = await db.query(
    "SELECT * FROM User WHERE id = ?",
    [id]
  );
  return rows[0];
}

export async function createUser({ name, email, password_hash, companyId }) {
  const [result] = await db.query(
    "INSERT INTO User (name, email, password_hash, companyId, created_at) VALUES (?, ?, ?, ?, NOW())",
    [name, email, password_hash, companyId]
  );
  return result.insertId;
}

// Company Models
export async function findCompanyByName(name) {
  const [rows] = await db.query(
    "SELECT * FROM Company WHERE name = ?",
    [name]
  );
  return rows[0];
}

export async function findCompanyById(id) {
  const [rows] = await db.query(
    "SELECT * FROM Company WHERE id = ?",
    [id]
  );
  return rows[0];
}

export async function createCompany(name) {
  const [result] = await db.query(
    "INSERT INTO Company (name, created_at) VALUES (?, NOW())",
    [name]
  );
  return result.insertId;
}

export async function getAllCompaniesExcept(excludeCompanyId) {
  const [rows] = await db.query(
    "SELECT id, name FROM Company WHERE id != ?",
    [excludeCompanyId]
  );
  return rows;
}

// Company Account Balance Models
export async function findBalanceByCompanyId(companyId) {
  const [rows] = await db.query(
    "SELECT * FROM CompanyAccountBalance WHERE companyId = ?",
    [companyId]
  );
  return rows[0];
}

export async function createBalance(companyId, carbonBalance = 0, cashBalance = 0) {
  const [result] = await db.query(
    "INSERT INTO CompanyAccountBalance (companyId, carbonBalance, cashBalance) VALUES (?, ?, ?)",
    [companyId, carbonBalance, cashBalance]
  );
  return result.insertId;
}

export async function updateBalance(companyId, carbonChange, cashChange) {
  await db.query(
    "UPDATE CompanyAccountBalance SET carbonBalance = carbonBalance + ?, cashBalance = cashBalance + ? WHERE companyId = ?",
    [carbonChange, cashChange, companyId]
  );
}

// Outstanding Request Models
export async function findRequestById(id) {
  const [rows] = await db.query(
    `SELECT 
      r.*,
      req_company.name as requestor_name,
      rec_company.name as recipient_name
    FROM OutstandingRequest r
    LEFT JOIN Company req_company ON r.requestorId = req_company.id
    LEFT JOIN Company rec_company ON r.recipientId = rec_company.id
    WHERE r.id = ?`,
    [id]
  );
  return rows[0];
}

export async function getCompanyRequests(companyId) {
  const [rows] = await db.query(
    `SELECT 
      r.*,
      c.name as recipient_name
    FROM OutstandingRequest r
    JOIN Company c ON r.recipientId = c.id
    WHERE r.requestorId = ? AND r.status = 'PENDING'
    ORDER BY r.created_at DESC`,
    [companyId]
  );
  return rows;
}

export async function getReceivedRequests(companyId) {
  const [rows] = await db.query(
    `SELECT 
      r.*,
      c.name as requestor_name
    FROM OutstandingRequest r
    JOIN Company c ON r.requestorId = c.id
    WHERE r.recipientId = ? AND r.status = 'PENDING'
    ORDER BY r.created_at DESC`,
    [companyId]
  );
  return rows;
}

export async function createRequest({ requestorId, recipientId, type, price, quantity, reason }) {
  const [result] = await db.query(
    "INSERT INTO OutstandingRequest (requestorId, recipientId, type, price, quantity, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())",
    [requestorId, recipientId, type, price, quantity, reason]
  );
  
  // Fetch the created request
  const [rows] = await db.query(
    "SELECT * FROM OutstandingRequest WHERE id = ?",
    [result.insertId]
  );
  return rows[0];
}

export async function updateRequest(id, updates) {
  const fields = [];
  const values = [];
  
  if (updates.recipientId !== undefined) {
    fields.push("recipientId = ?");
    values.push(updates.recipientId);
  }
  if (updates.type !== undefined) {
    fields.push("type = ?");
    values.push(updates.type);
  }
  if (updates.price !== undefined) {
    fields.push("price = ?");
    values.push(updates.price);
  }
  if (updates.quantity !== undefined) {
    fields.push("quantity = ?");
    values.push(updates.quantity);
  }
  if (updates.reason !== undefined) {
    fields.push("reason = ?");
    values.push(updates.reason);
  }
  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }
  
  fields.push("updated_at = NOW()");
  values.push(id);
  
  await db.query(
    `UPDATE OutstandingRequest SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
}

export async function deleteRequest(id) {
  await db.query(
    "DELETE FROM OutstandingRequest WHERE id = ?",
    [id]
  );
}

export async function getRequestWithBalances(id) {
  const [rows] = await db.query(
    `SELECT 
      r.*,
      req_bal.carbonBalance as requestor_carbonBalance,
      req_bal.cashBalance as requestor_cashBalance,
      rec_bal.carbonBalance as recipient_carbonBalance,
      rec_bal.cashBalance as recipient_cashBalance
    FROM OutstandingRequest r
    JOIN CompanyAccountBalance req_bal ON r.requestorId = req_bal.companyId
    JOIN CompanyAccountBalance rec_bal ON r.recipientId = rec_bal.companyId
    WHERE r.id = ?`,
    [id]
  );
  return rows[0];
}
