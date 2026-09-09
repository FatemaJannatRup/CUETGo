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

function writeDb(data) {
  ensureDb()
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

export default async function handler(req, res) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Not logged in.' })

  try {
    const user = jwt.verify(token, JWT_SECRET)
    const db = readDb()

    if (req.method === 'GET') {
      if (user.role === 'student') {
        const student = db.students.find((s) => s.id === user.id)
        return res.status(200).json({ wallet: Number(student?.wallet || 0) })
      }
      const driver = db.drivers.find((d) => d.id === user.id)
      return res.status(200).json({ wallet: Number(driver?.wallet || 0) })
    }

    if (req.method === 'POST') {
      const amount = Number(req.body?.amount || 0)
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Enter a valid top-up amount.' })
      }
      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can top up their wallet.' })
      }
      const student = db.students.find((s) => s.id === user.id)
      student.wallet = Number(student.wallet || 0) + amount
      writeDb(db)
      return res.status(200).json({ wallet: Number(student.wallet), message: 'Wallet updated successfully.' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' })
  }
}
