import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'

const formatTime = (value) => new Date(value).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })

export default function StudentHome() {
  const { user, logout } = useAuth()
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState({ from: user?.hall || '', to: '', requestedTime: '', seats: 1 })
  const [rides, setRides] = useState([])
  const [activeRide, setActiveRide] = useState(null)
  const [matches, setMatches] = useState([])
  const [tab, setTab] = useState('home')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function refresh() {
    api.myRides().then(({ rides: next }) => {
      setRides(next)
      setActiveRide(next.find((ride) => ['pending', 'accepted'].includes(ride.status)) || null)
    }).catch(() => {})
  }

  useEffect(() => {
    api.routes().then(({ locations: next }) => setLocations(next)).catch(() => {})
    refresh()
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
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const notifications = rides.filter((ride) => ride.status !== 'pending')
  const nav = [['home', 'Book'], ['history', 'History'], ['notifications', `Alerts${notifications.length ? ` (${notifications.length})` : ''}`], ['profile', 'Profile']]

  return <div className="h-full min-h-full flex flex-col bg-cream">
    <header className="bg-lilac-500 text-white px-6 pt-10 pb-6 rounded-b-3xl shadow-soft">
      <div className="flex justify-between items-start"><div><p className="text-white/70 text-sm">Good to see you</p><p className="font-display text-xl">{user?.name || 'Student'}</p></div><button onClick={logout} className="text-white/80 text-sm underline">Log out</button></div>
      <p className="text-white/70 text-xs mt-4">CUET campus rides, on your time</p>
    </header>
    <main className="flex-1 px-6 py-6 overflow-y-auto">
      {tab === 'home' && <>
        <div className="bg-white rounded-xl2 p-5 shadow-soft border border-lilac-100"><p className="font-semibold text-ink mb-4">Where are you going?</p><form onSubmit={requestRide} className="flex flex-col gap-3">
          <label className="text-xs text-ink/60">Pickup location<select required className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })}><option value="">Choose exact pickup</option>{locations.map((location) => <option key={location}>{location}</option>)}</select></label>
          <label className="text-xs text-ink/60">Destination<select required className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}><option value="">Choose exact destination</option>{locations.map((location) => <option key={location}>{location}</option>)}</select></label>
          <label className="text-xs text-ink/60">Pickup time<input required type="datetime-local" className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={form.requestedTime} onChange={(e) => setForm({ ...form, requestedTime: e.target.value })} /></label>
          <label className="text-xs text-ink/60">Seats (maximum 2)<select className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}><option value="1">1 seat</option><option value="2">2 seats</option></select></label>
          {error && <p className="text-rose-500 text-sm">{error}</p>}<button disabled={busy} className="bg-lilac-500 disabled:opacity-60 text-white font-medium py-3 rounded-full">{busy ? 'Finding a driver...' : 'Request rickshaw'}</button>
        </form></div>
        {activeRide && <div className="bg-white rounded-xl2 p-5 shadow-soft border border-lilac-100 mt-5"><div className="flex justify-between"><p className="font-semibold text-ink">Your ride</p><span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 capitalize">{activeRide.status}</span></div><p className="text-sm text-ink mt-3">{activeRide.from} → {activeRide.to}</p><p className="text-sm text-ink/60 mt-1">{formatTime(activeRide.requestedTime)} · {activeRide.seats} seat{activeRide.seats > 1 ? 's' : ''}</p>{matches.length > 0 && <p className="text-xs text-lilac-600 mt-3">{matches.length} nearby rider match{matches.length > 1 ? 'es' : ''} found</p>}</div>}
      </>}
      {tab === 'history' && <section><h2 className="font-display text-2xl text-ink mb-4">Ride history</h2>{rides.length === 0 ? <p className="text-sm text-ink/50">Your rides will appear here.</p> : rides.map((ride) => <div key={ride.id} className="bg-white rounded-xl2 p-4 mb-3 border border-lilac-100"><div className="flex justify-between"><p className="text-sm font-medium text-ink">{ride.from} → {ride.to}</p><span className="text-xs capitalize text-lilac-600">{ride.status}</span></div><p className="text-xs text-ink/50 mt-2">{formatTime(ride.requestedTime || ride.createdAt)} · {ride.seats || 1} seat{(ride.seats || 1) > 1 ? 's' : ''}</p></div>)}</section>}
      {tab === 'notifications' && <section><h2 className="font-display text-2xl text-ink mb-4">Notifications</h2>{notifications.length === 0 ? <p className="text-sm text-ink/50">No notifications yet.</p> : notifications.map((ride) => <div key={ride.id} className="bg-white rounded-xl2 p-4 mb-3 border border-lilac-100"><p className="text-sm text-ink">{ride.status === 'accepted' ? 'Your driver accepted the ride.' : 'Your ride is complete.'}</p><p className="text-xs text-ink/50 mt-2">{ride.from} → {ride.to}</p></div>)}</section>}
      {tab === 'profile' && <section><h2 className="font-display text-2xl text-ink mb-4">Profile</h2><div className="bg-white rounded-xl2 p-5 border border-lilac-100"><p className="text-lg font-medium text-ink">{user?.name}</p><p className="text-sm text-ink/60 mt-1">{user?.email}</p><p className="text-sm text-ink/70 mt-4"><span className="font-medium">Residence</span><br />{user?.hall || 'Hall not set'}</p></div></section>}
    </main>
    <nav className="border-t border-lilac-100 bg-white px-4 py-3 flex justify-around text-xs text-ink/60">{nav.map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={tab === key ? 'text-lilac-600 font-medium' : ''}>{label}</button>)}</nav>
  </div>
}
