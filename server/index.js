import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import rideRoutes from './routes/rides.js'

const app = express()

app.use(
  cors({
    origin: true,
    credentials: true,
  })
)
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/rides', rideRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'CUET Shared Ride backend is running',
    database: process.env.FIREBASE_PROJECT_ID ? 'firebase' : 'json',
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CUET Shared Ride backend running on port ${PORT}`)

  if (process.env.FIREBASE_PROJECT_ID) {
    console.log('Firebase Firestore database is enabled.')
  } else {
    console.log('No Firebase config detected. Using local JSON storage fallback.')
  }

  if (!process.env.GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY not set - ride matching will use the simple rule-based fallback.')
  }
})
