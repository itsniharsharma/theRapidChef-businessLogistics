import { logger } from '../utils/logger.js'

export function notFoundHandler(req, res) {
  res.status(404).json({
    message: 'Route not found',
    requestId: req.id,
  })
}

export function errorHandler(error, req, res, _next) {
  const status = error.status || error.statusCode || 500
  const safeMessage = status >= 500 ? 'Internal server error' : error.message || 'Request failed'
  const isProduction = process.env.NODE_ENV === 'production'

  logger.error('request_failed', {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl || req.url,
    statusCode: status,
    errorName: error?.name,
    errorMessage: error?.message,
    stack: isProduction ? undefined : error?.stack,
  })

  const payload = {
    message: safeMessage,
    requestId: req.id,
  }

  if (!isProduction && error?.stack) {
    payload.stack = error.stack
  }

  res.status(status).json(payload)
}
