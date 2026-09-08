import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'

const formatTime = (value) => new Date(value).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })

// Temporary mock data for the "available ride slots" view until the real
// endpoint (e.g. api.openRides()) is wired up.
const MOCK_OPEN_RIDES = [
  { id: 'mock-1', from: 'Shaheed Minar Hall', to: 'Academic Building', requestedTime: new Date(Date.now() + 30 * 60000).toISOString(), seatsTotal: 2, seatsTaken: 1, host: 'Nusrat', hostGender: 'female' },
  { id: 'mock-2', from: 'Library', to: 'Cafeteria', requestedTime: new Date(Date.now() + 60 * 60000).toISOString(), seatsTotal: 2, seatsTaken: 1, host: 'Tanvir', hostGender: 'male' },
  { id: 'mock-3', from: 'Central Field', to: 'CSE Building', requestedTime: new Date(Date.now() + 90 * 60000).toISOString(), seatsTotal: 2, seatsTaken: 1, host: 'Priya', hostGender: 'female' },
]

export default function StudentHome() {
  const { user, logout } = useAuth()
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState({ from: user?.hall || '', to: '', requestedTime: '', seats: 1, rideType: 'shared' })
  const [rides, setRides] = useState([])
  const [activeRide, setActiveRide] = useState(null)
  const [matches, setMatches] = useState([])
  const [tab, setTab] = useState('home')
  const [homeView, setHomeView] = useState('menu') // 'menu' | 'request' | 'slots'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [openRides, setOpenRides] = useState(MOCK_OPEN_RIDES)
  const [joiningId, setJoiningId] = useState(null)

  function refresh() {
    api.myRides().then(({ rides: next }) => {
      setRides(next)
      setActiveRide(next.find((ride) => ['pending', 'accepted'].includes(ride.status)) || null)
    }).catch(() => {})
  }

  useEffect(() => {
    api.routes().then(({ locations: next }) => setLocations(next)).catch(() => {})
    refresh()
    // Once a real endpoint exists, swap this for:
    // api.openRides().then(({ rides: next }) => setOpenRides(next)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!activeRide) return undefined
    const interval = setInterval(refresh, 4000)
    return () => clearInterval(interval)
  }, [activeRide?.id, activeRide?.status])

  async function requestRide(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await api.requestRide(form)
      setActiveRide(result.ride)
      setMatches(result.matches)
      refresh()
      setHomeView('menu')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function joinOpenRide(ride) {
    setJoiningId(ride.id)
    try {
      // Placeholder for the real call, e.g. await api.joinRide(ride.id)
      setOpenRides((prev) => prev.map((r) => r.id === ride.id ? { ...r, seatsTaken: r.seatsTaken + 1 } : r))
    } finally {
      setJoiningId(null)
    }
  }

  const notifications = rides.filter((ride) => ride.status !== 'pending')
  const nav = [['home', 'Book'], ['history', 'History'], ['notifications', `Alerts${notifications.length ? ` (${notifications.length})` : ''}`], ['profile', 'Profile']]

  function BackButton() {
    return <button onClick={() => setHomeView('menu')} className="text-sm text-lilac-600 mb-4 flex items-center gap-1">← Back</button>
  }

  return <div className="h-full min-h-full flex flex-col bg-cream">
    <header className="bg-lilac-500 text-white px-6 pt-10 pb-6 rounded-b-3xl shadow-soft">
      <div className="flex justify-between items-start"><div><p className="text-white/70 text-sm">Good to see you</p><p className="font-display text-xl">{user?.name || 'Student'}</p></div><button onClick={logout} className="text-white/80 text-sm underline">Log out</button></div>
      <p className="text-white/70 text-xs mt-4">CUET campus rides, on your time</p>
    </header>
    <main className="flex-1 px-6 py-6 overflow-y-auto">
      {tab === 'home' && <>

        {/* Menu: two icon-tile entry buttons */}
        {homeView === 'menu' && <div className="flex justify-center gap-8 pt-2">
          <button onClick={() => setHomeView('request')} className="flex flex-col items-center gap-2 w-24">
            <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lilac-400 to-lilac-600 shadow-soft flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white">
                <path d="M5 16.5v-4l1.6-4.4A2 2 0 0 1 8.5 6.7h7a2 2 0 0 1 1.9 1.4L19 12.5v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 16.5h14v2.2a.8.8 0 0 1-.8.8h-1.4a.8.8 0 0 1-.8-.8v-1M5 16.5v1a.8.8 0 0 0 .8.8h1.4a.8.8 0 0 0 .8-.8v-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8" cy="14" r="1" fill="currentColor" /><circle cx="16" cy="14" r="1" fill="currentColor" />
              </svg>
            </span>
            <span className="text-sm text-ink font-medium text-center">Request Ride</span>
          </button>
          <button onClick={() => setHomeView('slots')} className="flex flex-col items-center gap-2 w-24">
            <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lilac-400 to-lilac-600 shadow-soft flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white">
                <circle cx="9" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.7" />
                <path d="M4.5 18c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <circle cx="17" cy="9" r="1.8" stroke="currentColor" strokeWidth="1.7" />
                <path d="M14.2 18c.2-2 1.6-3.2 3.3-3.2 1.5 0 2.8.9 3.2 2.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-sm text-ink font-medium text-center">Available Ride Slots</span>
          </button>
        </div>}

        {/* Request a ride form */}
        {homeView === 'request' && <div className="bg-white rounded-xl2 p-5 shadow-soft border border-lilac-100">
          <BackButton />
          <p className="font-semibold text-ink mb-4">Where are you going?</p>
          <form onSubmit={requestRide} className="flex flex-col gap-3">
            <label className="text-xs text-ink/60">Pickup location
              <select required className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })}>
                <option value="">Choose exact pickup</option>
                {locations.map((location) => <option key={location}>{location}</option>)}
              </select>
            </label>
            <label className="text-xs text-ink/60">Destination
              <select required className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}>
                <option value="">Choose exact destination</option>
                {locations.map((location) => <option key={location}>{location}</option>)}
              </select>
            </label>
            <label className="text-xs text-ink/60">Pickup date & time
              <input
                required
                type="datetime-local"
                className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1"
                value={form.requestedTime}
                onChange={(e) => setForm({ ...form, requestedTime: e.target.value })}
              />
            </label>
            <div className="text-xs text-ink/60">
              Ride type
              <div className="flex gap-2 mt-1">
                <button type="button" onClick={() => setForm({ ...form, rideType: 'solo' })} className={`flex-1 py-2.5 rounded-full text-sm font-medium border ${form.rideType === 'solo' ? 'bg-lilac-500 text-white border-lilac-500' : 'bg-lilac-50 text-ink/70 border-lilac-200'}`}>Solo</button>
                <button type="button" onClick={() => setForm({ ...form, rideType: 'shared' })} className={`flex-1 py-2.5 rounded-full text-sm font-medium border ${form.rideType === 'shared' ? 'bg-lilac-500 text-white border-lilac-500' : 'bg-lilac-50 text-ink/70 border-lilac-200'}`}>Shared</button>
              </div>
            </div>
            <label className="text-xs text-ink/60">Seats (maximum 2)
              <select className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}>
                <option value="1">1 seat</option>
                <option value="2">2 seats</option>
              </select>
            </label>
            {error && <p className="text-rose-500 text-sm">{error}</p>}
            <button disabled={busy} className="bg-lilac-500 disabled:opacity-60 text-white font-medium py-3 rounded-full">
              {busy ? 'Finding a driver...' : 'Request rickshaw'}
            </button>
          </form>
        </div>}

        {/* Available ride slots */}
        {homeView === 'slots' && <div className="bg-white rounded-xl2 p-5 shadow-soft border border-lilac-100">
          <BackButton />
          <p className="font-semibold text-ink mb-4">Available ride slots</p>
          {openRides.length === 0
            ? <p className="text-sm text-ink/50">No open rides right now — check back soon.</p>
            : <div className="flex flex-col gap-3">
                {openRides.map((ride) => {
                  const seatsLeft = ride.seatsTotal - ride.seatsTaken
                  const full = seatsLeft <= 0
                  return (
                    <div key={ride.id} className="border border-lilac-100 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-ink">{ride.from} → {ride.to}</p>
                        <span className={`text-xs px-3 py-1 rounded-full ${full ? 'bg-ink/5 text-ink/40' : 'bg-green-100 text-green-700'}`}>
                          {full ? 'Full' : `${seatsLeft} seat${seatsLeft > 1 ? 's' : ''} open`}
                        </span>
                      </div>
                      <p className="text-xs text-ink/50 mt-2">{formatTime(ride.requestedTime)}</p>
                      <p className="text-xs text-ink/50 mt-1">Rider: {ride.host} · {ride.hostGender === 'female' ? 'Female' : 'Male'}</p>
                      <button
                        disabled={full || joiningId === ride.id}
                        onClick={() => joinOpenRide(ride)}
                        className="w-full mt-3 bg-lilac-100 disabled:opacity-50 text-lilac-700 font-medium py-2.5 rounded-full text-sm"
                      >
                        {full ? 'No seats left' : joiningId === ride.id ? 'Joining...' : 'Join this ride'}
                      </button>
                    </div>
                  )
                })}
              </div>}
        </div>}

        {activeRide && homeView === 'menu' && <div className="bg-white rounded-xl2 p-5 shadow-soft border border-lilac-100 mt-5"><div className="flex justify-between"><p className="font-semibold text-ink">Your ride</p><span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 capitalize">{activeRide.status}</span></div><p className="text-sm text-ink mt-3">{activeRide.from} → {activeRide.to}</p><p className="text-sm text-ink/60 mt-1">{formatTime(activeRide.requestedTime)} · {activeRide.seats} seat{activeRide.seats > 1 ? 's' : ''}</p>{matches.length > 0 && <p className="text-xs text-lilac-600 mt-3">{matches.length} nearby rider match{matches.length > 1 ? 'es' : ''} found</p>}</div>}
      </>}
      {tab === 'history' && <section><h2 className="font-display text-2xl text-ink mb-4">Ride history</h2>{rides.length === 0 ? <p className="text-sm text-ink/50">Your rides will appear here.</p> : rides.map((ride) => <div key={ride.id} className="bg-white rounded-xl2 p-4 mb-3 border border-lilac-100"><div className="flex justify-between"><p className="text-sm font-medium text-ink">{ride.from} → {ride.to}</p><span className="text-xs capitalize text-lilac-600">{ride.status}</span></div><p className="text-xs text-ink/50 mt-2">{formatTime(ride.requestedTime || ride.createdAt)} · {ride.seats || 1} seat{(ride.seats || 1) > 1 ? 's' : ''}</p></div>)}</section>}
      {tab === 'notifications' && <section><h2 className="font-display text-2xl text-ink mb-4">Notifications</h2>{notifications.length === 0 ? <p className="text-sm text-ink/50">No notifications yet.</p> : notifications.map((ride) => <div key={ride.id} className="bg-white rounded-xl2 p-4 mb-3 border border-lilac-100"><p className="text-sm text-ink">{ride.status === 'accepted' ? 'Your driver accepted the ride.' : 'Your ride is complete.'}</p><p className="text-xs text-ink/50 mt-2">{ride.from} → {ride.to}</p></div>)}</section>}
      {tab === 'profile' && <section><h2 className="font-display text-2xl text-ink mb-4">Profile</h2><div className="bg-white rounded-xl2 p-5 border border-lilac-100"><p className="text-lg font-medium text-ink">{user?.name}</p><p className="text-sm text-ink/60 mt-1">{user?.email}</p><p className="text-sm text-ink/70 mt-4"><span className="font-medium">Residence</span><br />{user?.hall || 'Hall not set'}</p></div></section>}
    </main>
    <nav className="border-t border-lilac-100 bg-white px-4 py-3 flex justify-around text-xs text-ink/60">{nav.map(([key, label]) => <button key={key} onClick={() => { setTab(key); setHomeView('menu') }} className={tab === key ? 'text-lilac-600 font-medium' : ''}>{label}</button>)}</nav>
  </div>
}
