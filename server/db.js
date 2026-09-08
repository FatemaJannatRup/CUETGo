import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'data', 'db.json')

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { students: [], drivers: [], rides: [] }
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2))
  }
}

export function readDb() {
  ensureDb()
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(raw)
}

export function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}
