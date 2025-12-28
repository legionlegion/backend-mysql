/**
 * Centralized error logging utility
 */
export const logError = (context, error, additionalInfo = {}) => {
  console.error("=== ERROR OCCURRED ===");
  console.error("Context:", context);
  console.error("Time:", new Date().toISOString());
  console.error("Message:", error.message);
  console.error("Code:", error.code);
  console.error("SQL State:", error.sqlState);
  console.error("SQL:", error.sql);
  console.error("Stack:", error.stack);
  
  if (Object.keys(additionalInfo).length > 0) {
    console.error("Additional Info:", JSON.stringify(additionalInfo, null, 2));
  }
  console.error("=====================");
};

/**
 * Format database error for client response
 */
export const formatDbError = (error) => {
  // Don't expose sensitive SQL details to client
  if (error.code === 'ER_DUP_ENTRY') {
    return 'Duplicate entry exists';
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return 'Referenced record does not exist';
  }
  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    return 'Database access denied';
  }
  
  return 'Database error occurred';
};
