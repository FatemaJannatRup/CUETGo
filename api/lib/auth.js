import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function getUserFromRequest(req) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null

  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function requireAuth(req, res, role) {
  const user = getUserFromRequest(req)
  if (!user) {
    res.status(401).json({ message: 'Not logged in.' })
    return null
  }
  if (role && user.role !== role) {
    res.status(403).json({ message: 'Not allowed for this role.' })
    return null
  }
  return user
}
