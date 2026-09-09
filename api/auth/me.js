import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json')

function ensureDb() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ students: [], drivers: [], rides: [] }, null, 2))
  }
}

function readDb() {
  ensureDb()
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

function publicStudent(s) {
  const { password, ...rest } = s
  return { ...rest, role: 'student', wallet: Number(rest.wallet || 0) }
}

function publicDriver(d) {
  const { password, ...rest } = d
  return { ...rest, role: 'driver', wallet: Number(rest.wallet || 0) }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Not logged in.' })

  try {
    const user = jwt.verify(token, JWT_SECRET)
    const db = readDb()
    if (user.role === 'student') {
      const student = db.students.find((s) => s.id === user.id)
      if (!student) return res.status(404).json({ message: 'Account not found.' })
      return res.status(200).json({ user: publicStudent(student) })
    }
    const driver = db.drivers.find((d) => d.id === user.id)
    if (!driver) return res.status(404).json({ message: 'Account not found.' })
    return res.status(200).json({ user: publicDriver(driver) })
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' })
  }
}
