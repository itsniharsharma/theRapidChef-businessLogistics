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

const originConfig = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)

    const allowlisted = originConfig.includes(origin)
    const localhostLike = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
    const ngrokLike = /^https?:\/\/[a-z0-9-]+\.(ngrok-free\.dev|ngrok-free\.app|ngrok\.io)$/i.test(origin)

    if (allowlisted || localhostLike || ngrokLike) {
      return callback(null, true)
    }

    return callback(new Error('CORS origin not allowed'))
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
