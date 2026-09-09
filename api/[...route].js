import studentSignup from './auth/student-signup.js'
import studentLogin from './auth/student-login.js'
import driverSignup from './auth/driver-signup.js'
import driverLogin from './auth/driver-login.js'
import me from './auth/me.js'
import profile from './auth/profile.js'
import wallet from './auth/wallet.js'

function parseRoute(req) {
  const raw = req.query?.route
  if (Array.isArray(raw)) return raw.flatMap((part) => String(part).split('/')).filter(Boolean)
  if (typeof raw === 'string') return raw.split('/').filter(Boolean)
  return []
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const route = parseRoute(req)

  if (!route.length) {
    return res.status(200).json({ ok: true, message: 'CUETGo API is running' })
  }

  if (route[0] === 'auth' && route[1] === 'student' && route[2] === 'signup') {
    req.body = req.body || {}
    return studentSignup(req, res)
  }

  if (route[0] === 'auth' && route[1] === 'student' && route[2] === 'login') {
    req.body = req.body || {}
    return studentLogin(req, res)
  }

  if (route[0] === 'auth' && route[1] === 'driver' && route[2] === 'signup') {
    req.body = req.body || {}
    return driverSignup(req, res)
  }

  if (route[0] === 'auth' && route[1] === 'driver' && route[2] === 'login') {
    req.body = req.body || {}
    return driverLogin(req, res)
  }

  if (route[0] === 'auth' && route[1] === 'me') {
    return me(req, res)
  }

  if (route[0] === 'auth' && route[1] === 'profile') {
    req.body = req.body || {}
    return profile(req, res)
  }

  if (route[0] === 'auth' && route[1] === 'wallet') {
    req.body = req.body || {}
    return wallet(req, res)
  }

  if (route[0] === 'rides') {
    if (route[1] === 'routes') {
      return (await import('./rides/routes.js')).default(req, res)
    }
  }

  return res.status(404).json({ message: 'Route not found.' })
}
