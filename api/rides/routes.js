export default function handler(req, res) {
  const HALLS = [
    'Muktijoddha Hall', 'Shahid Mohammad Shah Hall', 'Dr. Qudrat-E-Khuda Hall',
    'Kabi Kazi Nazrul Islam Hall', 'Shaheed Tareq Huda Hall', 'Shaheed Abu Sayed Hall',
    'Sufia Kamal Hall', 'Begum Shamsunnahar Khan Hall', 'Tapashi Rabeya Hall',
  ]
  const LOCATIONS = [...HALLS, 'CUET Main Gate', 'Academic Building', 'Central Library', 'Cafeteria']

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed' })
  }

  return res.status(200).json({ locations: LOCATIONS, halls: HALLS })
}
