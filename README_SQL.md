# Database Backend - SQL Version

This version uses direct MySQL queries instead of Prisma ORM.

## Setup

### 1. Configure Environment Variables

Create a `.env` file:

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dbs
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
PORT=3000
```

### 2. Create Database and Tables

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE dbs;
USE dbs;

# Run schema
source schema.sql;

# Or run directly
mysql -u root -p dbs < schema.sql
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Seed the Database

```bash
npm run seed
```

This creates:
- 3 companies with balances
- 3 test users (password: `password123`)
- Sample pending requests

Test accounts:
- `john@greenenergy.com`
- `jane@ecosolutions.com`
- `bob@carbonneutral.com`

### 5. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Project Structure

```
database-backend/
├── config/
│   └── database.js          # MySQL connection pool
├── models/
│   └── models.js            # Database query functions
├── controllers/
│   ├── auth.controller.js   # Authentication logic
│   ├── company.controller.js
│   ├── request.controller.js
│   └── transaction.controller.js
├── middleware/
│   └── auth.middleware.js   # JWT authentication
├── routes/
│   ├── auth.routes.js
│   ├── company.routes.js
│   ├── request.routes.js
│   └── transaction.routes.js
├── scripts/
│   └── seed.js              # Database seeding
├── schema.sql               # Database schema
└── server.js                # Express app entry point
```

## Key Differences from Prisma Version

### Connection
- **Prisma**: `import prisma from './prisma/client.js'`
- **SQL**: `import db from './config/database.js'`

### Queries
**Prisma**:
```javascript
const user = await prisma.user.findUnique({ where: { email }});
```

**SQL**:
```javascript
const [rows] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
const user = rows[0];
```

### Transactions
**Prisma**:
```javascript
await prisma.$transaction([
  prisma.request.update(...),
  prisma.balance.update(...)
]);
```

**SQL**:
```javascript
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  await connection.query('UPDATE ...');
  await connection.query('UPDATE ...');
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

## API Endpoints

Same as Prisma version - no changes to the API surface:

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`

### Company
- GET `/api/company/balance`
- GET `/api/company/all`

### Requests
- GET `/api/requests/company`
- GET `/api/requests/received`
- POST `/api/requests`
- PUT `/api/requests/:id`
- DELETE `/api/requests/:id`

### Transactions
- POST `/api/transactions/:id/process`
- POST `/api/transactions/bulk-process`

## Database Schema

### User
- `id` (PK)
- `name`
- `email` (unique)
- `password_hash`
- `companyId` (FK → Company)
- `created_at`

### Company
- `id` (PK)
- `name` (unique)
- `created_at`

### CompanyAccountBalance
- `id` (PK)
- `companyId` (unique, FK → Company)
- `carbonBalance`
- `cashBalance`

### OutstandingRequest
- `id` (PK)
- `requestorId` (FK → Company)
- `recipientId` (FK → Company)
- `type` (BUY/SELL)
- `price`
- `quantity`
- `reason`
- `status` (PENDING/ACCEPTED/REJECTED)
- `created_at`
- `updated_at`

## Testing

```bash
npm test
```

## Troubleshooting

### Connection Errors
- Check MySQL is running: `mysql -u root -p`
- Verify credentials in `.env`
- Ensure database `dbs` exists

### Schema Errors
- Drop and recreate: `DROP DATABASE dbs; CREATE DATABASE dbs;`
- Re-run schema: `mysql -u root -p dbs < schema.sql`

### Port Conflicts
- Change `PORT` in `.env` if 3000 is in use
