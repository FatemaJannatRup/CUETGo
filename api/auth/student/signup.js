import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json')

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1e6) {
        req.destroy()
        reject(new Error('Request body too large'))
      }
    })
    req.on('end', () => {
      if (!body) return resolve({})
      try {
        resolve(JSON.parse(body))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

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

function publicStudent(s) {
  const { password, ...rest } = s
  return { ...rest, role: 'student', wallet: Number(rest.wallet || 0) }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const body = await readJsonBody(req)
    const { name, email, studentId, gender, hall, password } = body || {}
    const CUET_EMAIL = /^u\d{7}@student\.cuet\.ac\.bd$/i
    const STUDENT_ID = /^\d{7}$/
    const GENDERS = ['male', 'female', 'unknown']

    if (!name || !name.trim()) return res.status(400).json({ message: 'Enter your full name.' })
    if (!CUET_EMAIL.test(email || '')) return res.status(400).json({ message: 'Use your CUET student email, e.g. u2204064@student.cuet.ac.bd' })
    if (!STUDENT_ID.test(studentId || '')) return res.status(400).json({ message: 'Enter your 7-digit student ID, e.g. 2204064' })
    if (!GENDERS.includes(gender)) return res.status(400).json({ message: 'Select your gender.' })
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' })

    const db = readDb()
    const emailLower = (email || '').toLowerCase()
    if (db.students.find((s) => s.email === emailLower)) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }
    if (db.students.find((s) => s.studentId === String(studentId))) {
      return res.status(409).json({ message: 'An account with this student ID already exists.' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const student = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: emailLower,
      studentId: String(studentId),
      gender,
      hall: hall || '',
      wallet: 0,
      password: hashed,
      createdAt: new Date().toISOString(),
    }

    db.students.push(student)
    writeDb(db)
    const token = jwt.sign({ id: student.id, role: 'student' }, JWT_SECRET, { expiresIn: '7d' })
    return res.status(200).json({ token, user: publicStudent(student) })
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Invalid request payload.' })
  }
}
