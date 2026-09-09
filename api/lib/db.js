import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'server', 'data', 'db.json')
const INITIAL_DATA = { students: [], drivers: [], rides: [] }

export function ensureDb() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2))
  }
}

export function readDb() {
  ensureDb()
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

export function writeDb(data) {
  ensureDb()
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

export function publicStudent(s) {
  const { password, ...rest } = s
  return { ...rest, role: 'student', wallet: Number(rest.wallet || 0) }
}

export function publicDriver(d) {
  const { password, ...rest } = d
  return { ...rest, role: 'driver', wallet: Number(rest.wallet || 0) }
}
