// Centralized error handling middleware

export class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let code = err.code || "INTERNAL_ERROR";

  // Log error for debugging
  console.error(" Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
  }

  if (err.code === "ECONNREFUSED") {
    statusCode = 503;
    message = "Service temporarily unavailable";
    code = "SERVICE_UNAVAILABLE";
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production" && !err.isOperational) {
    message = "An unexpected error occurred";
  }

  // Build response object
  const errorResponse = {
    success: false,
    error: {
      message,
      code,
    },
    timestamp: new Date().toISOString(),
  };

  // Add stack trace only in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Async handler wrapper to catch errors
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
