import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'data', 'db.json')
const INITIAL_DATA = { students: [], drivers: [], rides: [] }

function ensureDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2))
  }
}

function getFirebaseCredentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    return null
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  }
}

export function isFirebaseConfigured() {
  return Boolean(getFirebaseCredentials())
}

export function getDatabaseMode() {
  return isFirebaseConfigured() ? 'firebase' : 'json'
}

async function getFirebaseDb() {
  if (!isFirebaseConfigured()) return null

  try {
    const admin = await import('firebase-admin')
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          project_id: process.env.FIREBASE_PROJECT_ID,
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
      })
    }

    return admin.firestore()
  } catch (err) {
    console.warn('Firebase unavailable, falling back to local JSON storage:', err.message)
    return null
  }
}

export async function readDb() {
  const firestore = await getFirebaseDb()
  if (firestore) {
    const ref = firestore.collection('app').doc('data')
    const snap = await ref.get()
    if (snap.exists) {
      return snap.data() || structuredClone(INITIAL_DATA)
    }

    await ref.set(INITIAL_DATA)
    return structuredClone(INITIAL_DATA)
  }

  ensureDb()
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(raw)
}

export async function writeDb(data) {
  const firestore = await getFirebaseDb()
  if (firestore) {
    await firestore.collection('app').doc('data').set(data)
    return
  }

  ensureDb()
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}