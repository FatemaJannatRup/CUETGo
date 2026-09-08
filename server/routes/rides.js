import { Router } from 'express'
import crypto from 'crypto'
import { readDb, writeDb } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { findMatches } from '../services/gemini.js'

const router = Router()

const HALLS = [
  'Muktijoddha Hall', 'Shahid Mohammad Shah Hall', 'Dr. Qudrat-E-Khuda Hall',
  'Kabi Kazi Nazrul Islam Hall', 'Shaheed Tareq Huda Hall', 'Shaheed Abu Sayed Hall',
  'Sufia Kamal Hall', 'Begum Shamsunnahar Khan Hall', 'Tapashi Rabeya Hall',
]
const LOCATIONS = [...HALLS, 'CUET Main Gate', 'Academic Building', 'Central Library', 'Cafeteria']

function fareFor(from, to) {
  if (HALLS.includes(from) && HALLS.includes(to)) return 10
  if (HALLS.includes(from)) return 20
  return 15
}

function studentName(db, studentId) {
  const s = db.students.find((x) => x.id === studentId)
  return s ? s.name : 'Student'
}

router.get('/routes', (req, res) => {
  res.json({ locations: LOCATIONS, halls: HALLS })
})

// Student creates a ride request, then asks Gemini (or fallback) for matches
router.post('/request', requireAuth('student'), async (req, res) => {
  const { from, to, requestedTime, seats = 1 } = req.body || {}
  if (!LOCATIONS.includes(from) || !LOCATIONS.includes(to) || from === to) return res.status(400).json({ message: 'Choose two different CUET locations.' })
  if (!requestedTime || Number.isNaN(new Date(requestedTime).getTime())) return res.status(400).json({ message: 'Choose a pickup time.' })
  if (![1, 2].includes(Number(seats))) return res.status(400).json({ message: 'A rickshaw has only 1 or 2 seats.' })

  const db = readDb()
  const ride = {
    id: crypto.randomUUID(),
    studentId: req.user.id,
    from,
    to,
    fare: fareFor(from, to),
    requestedTime: new Date(requestedTime).toISOString(),
    seats: Number(seats),
    passengerCount: Number(seats),
    status: 'pending', // pending -> matched -> accepted -> completed
    driverId: null,
    matchedRideIds: [],
    createdAt: new Date().toISOString(),
  }
  db.rides.push(ride)

  const others = db.rides.filter((r) => r.status === 'pending' && r.id !== ride.id && r.from === from && r.to === to && Math.abs(new Date(r.requestedTime || r.createdAt) - new Date(ride.requestedTime)) < 30 * 60 * 1000 && (r.passengerCount || r.seats || 1) + ride.passengerCount <= 2)
  const matches = await findMatches(ride, others)
  ride.matchedRideIds = matches.map((m) => m.rideId)
  writeDb(db)

  const matchedRiders = ride.matchedRideIds
    .map((id) => db.rides.find((r) => r.id === id))
    .filter(Boolean)
    .map((r) => ({ name: studentName(db, r.studentId), route: `${r.from} → ${r.to}`, time: r.createdAt }))

  res.json({ ride, matches: matchedRiders })
})

router.get('/mine', requireAuth('student'), (req, res) => {
  const db = readDb()
  const mine = db.rides
    .filter((r) => r.studentId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json({ rides: mine })
})

router.get('/pending', requireAuth('driver'), (req, res) => {
  const db = readDb()
  const pending = db.rides
    .filter((r) => r.status === 'pending')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const grouped = {}
  for (const r of pending) {
    const timeKey = new Date(r.requestedTime || r.createdAt).toISOString().slice(0, 16)
    const key = `${r.from}__${r.to}__${timeKey}`
    if (!grouped[key]) {
      grouped[key] = {
        key,
        from: r.from,
        to: r.to,
        fare: r.fare,
        rideIds: [],
        riders: 0,
        time: r.createdAt,
        requestedTime: r.requestedTime || r.createdAt,
      }
    }
    grouped[key].rideIds.push(r.id)
    grouped[key].riders += r.passengerCount || r.seats || 1
  }

  res.json({ groups: Object.values(grouped) })
})

router.post('/accept', requireAuth('driver'), (req, res) => {
  const { rideIds } = req.body || {}
  if (!Array.isArray(rideIds) || rideIds.length === 0) {
    return res.status(400).json({ message: 'No ride selected.' })
  }
  const db = readDb()
  let count = 0
  let seats = 0
  for (const ride of db.rides) {
    if (rideIds.includes(ride.id) && ride.status === 'pending') {
      const requestedSeats = ride.passengerCount || ride.seats || 1
      if (seats + requestedSeats > 2) continue
      ride.status = 'accepted'
      ride.driverId = req.user.id
      ride.acceptedAt = new Date().toISOString()
      count += 1
      seats += requestedSeats
    }
  }
  if (!count) return res.status(409).json({ message: 'This request is no longer available or exceeds the 2-seat capacity.' })
  writeDb(db)
  res.json({ accepted: count })
})

router.post('/:id/complete', requireAuth('driver'), (req, res) => {
  const db = readDb()
  const ride = db.rides.find((item) => item.id === req.params.id && item.driverId === req.user.id)
  if (!ride) return res.status(404).json({ message: 'Ride not found.' })
  ride.status = 'completed'
  ride.completedAt = new Date().toISOString()
  writeDb(db)
  res.json({ ride })
})

// Driver: rides they have accepted
router.get('/mine-driver', requireAuth('driver'), (req, res) => {
  const db = readDb()
  const mine = db.rides
    .filter((r) => r.driverId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  res.json({ rides: mine })
})

export default router
