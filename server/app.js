import cors from 'cors'
import compression from 'compression'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import restaurantRoutes from './routes/restaurantRoutes.js'
import menuRoutes from './routes/menuRoutes.js'
import tableRoutes from './routes/tableRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import offerRoutes from './routes/offerRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()
app.set('trust proxy', 1)
app.set('etag', 'strong')
const isProduction = process.env.NODE_ENV === 'production'

const originConfig = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)

    const normalizedOrigin = String(origin).trim()
    const allowlisted = originConfig.includes(normalizedOrigin)
    const localhostLike = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
    const lanLike =
      /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(
        origin,
      )
    const ngrokLike = /^https?:\/\/[a-z0-9-]+\.(ngrok-free\.dev|ngrok-free\.app|ngrok\.io|ngrok\.app)$/i.test(
      origin,
    )

    if (allowlisted || localhostLike || lanLike || ngrokLike || !isProduction) {
      return callback(null, true)
    }

    const corsError = new Error('CORS origin not allowed')
    corsError.status = 403
    return callback(corsError)
  },
}

app.use(cors(corsOptions))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: "Chef's Bud - Restaurant Revenue OS" })
})

app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/offers', offerRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/payments', paymentRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
