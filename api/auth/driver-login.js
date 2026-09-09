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

function publicDriver(d) {
  const { password, ...rest } = d
  return { ...rest, role: 'driver', wallet: Number(rest.wallet || 0) }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { identifier, password } = req.body || {}
  const db = readDb()
  const driver = db.drivers.find((d) => d.identifier === (identifier || '').trim().toLowerCase())
  if (!driver) return res.status(401).json({ message: 'এই তথ্য দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।' })

  const match = await bcrypt.compare(password || '', driver.password)
  if (!match) return res.status(401).json({ message: 'পাসওয়ার্ড সঠিক নয়।' })

  const token = jwt.sign({ id: driver.id, role: 'driver' }, JWT_SECRET, { expiresIn: '7d' })
  return res.status(200).json({ token, user: publicDriver(driver) })
}
