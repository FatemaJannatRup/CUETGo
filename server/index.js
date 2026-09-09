```js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import rideRoutes from './routes/rides.js'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/rides', rideRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'CUET Shared Ride backend is running'
  })
})

// Render provides the PORT environment variable
const PORT = process.env.PORT || 5000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CUET Shared Ride backend running on port ${PORT}`)

  if (!process.env.GEMINI_API_KEY) {
    console.log(
      'GEMINI_API_KEY not set — ride matching will use the simple rule-based fallback.'
    )
  }
})
```
