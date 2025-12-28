import mysql from "mysql2";
import "dotenv/config";

console.log("=== DATABASE CONFIG ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "***SET***" : "NOT SET");
console.log("======================");

// Create a database connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "dbs",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("!!! DATABASE CONNECTION FAILED !!!");
    console.error("Error Code:", err.code);
    console.error("Error Number:", err.errno);
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    console.error("SQL State:", err.sqlState);
    return;
  }
  console.log("✅ Successfully connected to MySQL database!");
  console.log("Connection ID:", connection.threadId);
  connection.release();
});

// Export the promise-based pool
export default pool.promise();
