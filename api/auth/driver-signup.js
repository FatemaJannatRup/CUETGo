import bcrypt from 'bcryptjs'
import crypto from 'crypto'
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

function publicDriver(d) {
  const { password, ...rest } = d
  return { ...rest, role: 'driver', wallet: Number(rest.wallet || 0) }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { name, identifier, nid, rickshaw, password } = req.body || {}
  const GMAIL = /^[a-zA-Z0-9._%+-]+@gmail\.com$/
  const PHONE = /^01[3-9]\d{8}$/
  const NID = /^\d{10}$|^\d{13}$|^\d{17}$/

  if (!name || !name.trim()) return res.status(400).json({ message: 'নাম লিখুন' })
  const idLower = (identifier || '').trim().toLowerCase()
  if (!GMAIL.test(idLower) && !PHONE.test(idLower)) {
    return res.status(400).json({ message: 'জিমেইল অথবা সঠিক মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)' })
  }
  if (!NID.test((nid || '').trim())) {
    return res.status(400).json({ message: 'সঠিক এনআইডি নম্বর দিন (যাচাইয়ের জন্য প্রয়োজন)' })
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' })
  }

  const db = readDb()
  if (db.drivers.find((d) => d.identifier === idLower)) {
    return res.status(409).json({ message: 'এই তথ্য দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।' })
  }

  const hashed = await bcrypt.hash(password, 10)
  const driver = {
    id: crypto.randomUUID(),
    name: name.trim(),
    identifier: idLower,
    nid: (nid || '').trim(),
    rickshaw: rickshaw || '',
    wallet: 0,
    verified: false,
    password: hashed,
    createdAt: new Date().toISOString(),
  }

  db.drivers.push(driver)
  writeDb(db)

  const token = jwt.sign({ id: driver.id, role: 'driver' }, JWT_SECRET, { expiresIn: '7d' })
  return res.status(200).json({ token, user: publicDriver(driver) })
}
