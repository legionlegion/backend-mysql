import mysql from "mysql2";
import "dotenv/config";

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
    // Log the error but do not exit the entire process here. Exiting
    // will terminate the server whenever the DB is temporarily
    // unreachable (bad creds, DB not ready). Allow the app to start
    // so you can inspect logs or serve limited endpoints while
    // addressing DB connectivity.
    console.error("Database connection failed:", err.stack);
    return;
  }
  console.log("Connected to the MySQL database.");
  connection.release();
});

// Export the promise-based pool
export default pool.promise();
