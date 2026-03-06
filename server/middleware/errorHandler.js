export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Route not found' })
}

export function errorHandler(error, req, res, _next) {
  const status = error.status || error.statusCode || 500
  const message = error.message || 'Internal server error'
  const isProduction = process.env.NODE_ENV === 'production'

  if (status >= 500 || !isProduction) {
    console.error(error)
  }

  const payload = { message }
  if (!isProduction && error?.stack) {
    payload.stack = error.stack
  }

  res.status(status).json(payload)
}
