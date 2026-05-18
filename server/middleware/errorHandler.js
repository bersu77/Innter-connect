// Global error handler — converts thrown errors into consistent JSON responses.
const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = `That ${field} is already in use`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // File-upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (maximum 5 MB)' : 'File upload error';
  }

  // Never leak internal details on a 500.
  if (statusCode === 500) {
    console.error('Server error:', err);
    message = 'Something went wrong on our end. Please try again.';
  }

  res.status(statusCode).json({ success: false, message });
};

// 404 handler for unmatched routes.
export const notFound = (req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

export default errorHandler;
