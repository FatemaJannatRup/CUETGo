import bcrypt from 'bcryptjs'
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body || {}
  const db = readDb()
  const student = db.students.find((s) => s.email === (email || '').toLowerCase())
  if (!student) return res.status(401).json({ message: 'No account found with this email.' })

  const match = await bcrypt.compare(password || '', student.password)
  if (!match) return res.status(401).json({ message: 'Incorrect password.' })

  const token = jwt.sign({ id: student.id, role: 'student' }, JWT_SECRET, { expiresIn: '7d' })
  return res.status(200).json({ token, user: publicStudent(student) })
}
