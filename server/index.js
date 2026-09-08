import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import rideRoutes from './routes/rides.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/rides', rideRoutes)

app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`CUET Shared Ride backend running on http://localhost:${PORT}`)
  if (!process.env.GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY not set — ride matching will use the simple rule-based fallback.')
  }
})
