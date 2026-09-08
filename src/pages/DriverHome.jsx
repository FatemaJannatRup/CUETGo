import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'

const formatTime = (value) => new Date(value).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })

export default function DriverHome() {
  const { user, logout } = useAuth()
  const [groups, setGroups] = useState([])
  const [rides, setRides] = useState([])
  const [tab, setTab] = useState('requests')
  const [error, setError] = useState('')

  function refresh() {
    api.pendingGroups().then(({ groups: next }) => setGroups(next)).catch(() => {})
    api.myDriverRides().then(({ rides: next }) => setRides(next)).catch(() => {})
  }
  useEffect(() => { refresh(); const interval = setInterval(refresh, 4000); return () => clearInterval(interval) }, [])

  async function accept(group) {
    setError('')
    try { await api.acceptRide(group.rideIds); refresh() } catch (e) { setError(e.message) }
  }
  async function complete(ride) {
    setError('')
    try { await api.completeRide(ride.id); refresh() } catch (e) { setError(e.message) }
  }

  return <div className="bn h-full min-h-full flex flex-col bg-cream">
    <header className="bg-lilac-500 text-white px-6 pt-10 pb-6 rounded-b-3xl shadow-soft"><div className="flex justify-between items-start"><div><p className="text-white/70 text-sm">Driver console</p><p className="font-display text-xl">{user?.name || 'Driver'}</p></div><button onClick={logout} className="text-white/80 text-sm underline">Log out</button></div><p className="text-white/70 text-xs mt-4">Every rickshaw carries up to 2 seats</p></header>
    <main className="flex-1 px-6 py-6 overflow-y-auto">
+      {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}
+      {tab === 'requests' && <section><div className="flex justify-between items-center mb-4"><h2 className="font-display text-2xl text-ink">Ride requests</h2><span className="text-xs text-ink/50">Live updates</span></div>{groups.length === 0 ? <p className="text-sm text-ink/50">No requests right now.</p> : groups.map((group) => <div key={group.key} className="bg-white rounded-xl2 p-5 mb-3 shadow-soft border border-lilac-100"><p className="font-medium text-ink">{group.from} → {group.to}</p><p className="text-sm text-ink/60 mt-2">{formatTime(group.requestedTime)} · {group.riders}/2 seats requested</p><p className="text-sm text-ink/60 mt-1">৳{group.fare} per seat</p><button disabled={group.riders > 2} onClick={() => accept(group)} className="w-full bg-lilac-500 disabled:opacity-40 text-white font-medium py-2.5 rounded-full mt-4">Accept ride</button></div>)}</section>}
+      {tab === 'active' && <section><h2 className="font-display text-2xl text-ink mb-4">My rides</h2>{rides.length === 0 ? <p className="text-sm text-ink/50">Accepted rides will appear here.</p> : rides.map((ride) => <div key={ride.id} className="bg-white rounded-xl2 p-5 mb-3 border border-lilac-100"><div className="flex justify-between"><p className="font-medium text-ink">{ride.from} → {ride.to}</p><span className="text-xs capitalize text-lilac-600">{ride.status}</span></div><p className="text-sm text-ink/60 mt-2">{formatTime(ride.requestedTime || ride.createdAt)} · {ride.seats || 1} seat{(ride.seats || 1) > 1 ? 's' : ''}</p>{ride.status === 'accepted' && <button onClick={() => complete(ride)} className="w-full border border-lilac-300 text-lilac-700 font-medium py-2.5 rounded-full mt-4">Mark completed</button>}</div>)}</section>}
+      {tab === 'profile' && <section><h2 className="font-display text-2xl text-ink mb-4">Profile</h2><div className="bg-white rounded-xl2 p-5 border border-lilac-100"><p className="text-lg font-medium text-ink">{user?.name}</p><p className="text-sm text-ink/60 mt-1">{user?.identifier}</p><p className="text-sm text-ink/70 mt-4">Rickshaw: {user?.rickshaw || 'Not specified'}</p></div></section>}
    </main>
+    <nav className="border-t border-lilac-100 bg-white px-4 py-3 flex justify-around text-xs text-ink/60"><button onClick={() => setTab('requests')} className={tab === 'requests' ? 'text-lilac-600 font-medium' : ''}>Requests</button><button onClick={() => setTab('active')} className={tab === 'active' ? 'text-lilac-600 font-medium' : ''}>My rides</button><button onClick={() => setTab('profile')} className={tab === 'profile' ? 'text-lilac-600 font-medium' : ''}>Profile</button></nav>
  </div>
}
