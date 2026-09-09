import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api.js'

const formatTime = (value) => new Date(value).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })

const HALLS = ['Muktijoddha Hall', 'Shahid Mohammad Shah Hall', 'Dr. Qudrat-E-Khuda Hall', 'Kabi Kazi Nazrul Islam Hall', 'Shaheed Tareq Huda Hall', 'Shaheed Abu Sayed Hall', 'Sufia Kamal Hall', 'Begum Shamsunnahar Khan Hall', 'Tapashi Rabeya Hall']

function genderLabel(g) {
  if (g === 'female') return 'Female'
  if (g === 'male') return 'Male'
  if (g === 'unknown') return 'Prefer not to say'
  return 'Not set'
}

// (ride slots, matches, etc.) so a "prefer not to say" choice reads
// as Unknown to others, never their own friendlier label.
function publicGenderLabel(g) {
  if (g === 'female') return 'Female'
  if (g === 'male') return 'Male'
  return 'Unknown'
}

export default function StudentHome() {
  const { user, logout, updateProfile } = useAuth()
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState({ from: user?.hall || '', to: '', requestedTime: '', seats: 1, coPassengerName: '', coPassengerPhone: '', notes: '' })
  const [rides, setRides] = useState([])
  const [activeRide, setActiveRide] = useState(null)
  const [matches, setMatches] = useState([])
  const [tab, setTab] = useState('home')
  const [homeView, setHomeView] = useState('menu') // 'menu' | 'request' | 'slots' | 'pending'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [syncError, setSyncError] = useState('')
  const [openRides, setOpenRides] = useState([])
  const [joiningId, setJoiningId] = useState(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: '', hall: '', gender: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [wallet, setWallet] = useState(Number(user?.wallet || 0))
  const [walletInput, setWalletInput] = useState('100')
  const [walletBusy, setWalletBusy] = useState(false)
  const [profileOverride, setProfileOverride] = useState({})
  const displayUser = user ? { ...user, ...profileOverride } : user

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', hall: user.hall || '', gender: user.gender || '' })
      setWallet(Number(user.wallet || 0))
    }
  }, [user])

  async function saveProfile(event) {
    event.preventDefault()
    setProfileSaving(true)
    try {
      const nextUser = await api.updateProfile(profileForm)
      updateProfile(nextUser.user)
      setProfileOverride({ name: nextUser.user.name, hall: nextUser.user.hall, gender: nextUser.user.gender })
      setEditingProfile(false)
      setSyncError('')
    } catch (e) {
      setSyncError(e.message)
    } finally {
      setProfileSaving(false)
    }
  }

  async function topUpWallet() {
    const amount = Number(walletInput)
    if (!amount || amount <= 0) {
      setSyncError('Enter a valid wallet amount.')
      return
    }
    setWalletBusy(true)
    try {
      const result = await api.topUpWallet(amount)
      setWallet(Number(result.wallet || 0))
      setWalletInput('100')
      setSyncError('')
      updateProfile({ ...user, wallet: Number(result.wallet || 0) })
    } catch (e) {
      setSyncError(e.message)
    } finally {
      setWalletBusy(false)
    }
  }

  async function refresh() {
    try {
      const [mine, available] = await Promise.all([api.myRides(), api.openRides()])
      setRides(mine.rides)
      setActiveRide(mine.rides.find((ride) => ['pending', 'accepted'].includes(ride.status)) || null)
      setOpenRides(available.rides)
      setSyncError('')
    } catch (e) {
      setSyncError('Ride updates unavailable: ' + e.message)
    }
  }

  useEffect(() => {
    api.routes().then(({ locations: next }) => setLocations(next)).catch((e) => setSyncError(e.message))
    refresh()
    const interval = setInterval(refresh, 4000)
    return () => clearInterval(interval)
  }, [])

  async function requestRide(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const pickupTime = new Date(form.requestedTime)
      if (Number.isNaN(pickupTime.getTime()) || pickupTime.getTime() <= Date.now()) {
        throw new Error('Choose a pickup time at least a few minutes from now.')
      }
      const payload = {
        ...form,
        requestedTime: pickupTime.toISOString(),
        coPassengerName: form.coPassengerName?.trim(),
        coPassengerPhone: form.coPassengerPhone?.trim(),
        notes: form.notes?.trim(),
      }
      const result = await api.requestRide(payload)
      setActiveRide(result.ride)
      setMatches(result.matches)
      refresh()
      setForm({ from: user?.hall || '', to: '', requestedTime: '', seats: 1, coPassengerName: '', coPassengerPhone: '', notes: '' })
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
      setError('')
      await api.joinRide(ride.id)
      await refresh()
      setTab('home')
      setHomeView('pending')
    } catch (e) {
      setError(e.message)
      await refresh()
    } finally {
      setJoiningId(null)
    }
  }

  const notifications = [
    ...openRides.map((ride) => ({ ...ride, message: ride.host + ' booked a ride with a seat available.', available: true })),
    ...rides.filter((ride) => ride.status !== 'pending' || (ride.participantIds || []).length > 0).map((ride) => ({
      ...ride, message: ride.status === 'accepted' ? 'Your driver accepted the ride.' : ride.status === 'completed' ? 'Your ride is complete.' : ride.status === 'pending' ? 'Your shared ride now has another passenger.' : 'Your ride is ' + ride.status + '.',
    })),
  ]
  const pendingRides = rides.filter((ride) => ride.status === 'pending')
  const pastRides = rides.filter((ride) => ['completed', 'cancelled'].includes(ride.status))
  const nav = [['home', 'Home'], ['history', 'History'], ['notifications', `Alerts${notifications.length ? ` (${notifications.length})` : ''}`], ['profile', 'Profile']]

  function BackButton() {
    return <button onClick={() => setHomeView('menu')} className="text-sm text-lilac-600 mb-4 flex items-center gap-1">← Back</button>
  }

  return <div className="h-full min-h-full flex flex-col bg-cream">
    <header className="bg-lilac-500 text-white px-6 pt-10 pb-6 rounded-b-3xl shadow-soft">
      <div className="flex justify-between items-start"><div><p className="text-white/70 text-sm">Good to see you</p><p className="font-display text-xl">{displayUser?.name || 'Student'}</p></div><button onClick={logout} className="text-white/80 text-sm underline">Log out</button></div>
      <p className="text-white/70 text-xs mt-4">CUET campus rides, on your time</p>
    </header>
    <main className="flex-1 px-6 py-6 overflow-y-auto">
      {syncError && <p role="alert" className="text-rose-500 text-sm mb-4">{syncError}</p>}
      {error && <p role="alert" className="text-rose-500 text-sm mb-4">{error}</p>}
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
            <span className="text-sm text-ink font-medium text-center">Book Ride</span>
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
          <button onClick={() => setHomeView('pending')} className="flex flex-col items-center gap-2 w-24">
            <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lilac-400 to-lilac-600 shadow-soft flex items-center justify-center relative">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white">
                <circle cx="12" cy="12" r="7.3" stroke="currentColor" strokeWidth="1.7" />
                <path d="M12 8v4.3l3 1.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {pendingRides.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] leading-none rounded-full w-5 h-5 flex items-center justify-center">{pendingRides.length}</span>}
            </span>
            <span className="text-sm text-ink font-medium text-center">Pending Requests</span>
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
            <label className="text-xs text-ink/60">Seats (maximum 2)
              <select className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })}>
                <option value="1">1 seat</option>
                <option value="2">2 seats</option>
              </select>
            </label>
            {Number(form.seats) === 2 && (
              <>
                <label className="text-xs text-ink/60">Co-passenger name
                  <input className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={form.coPassengerName} onChange={(e) => setForm({ ...form, coPassengerName: e.target.value })} placeholder="Name of second rider" />
                </label>
                <label className="text-xs text-ink/60">Co-passenger contact
                  <input className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={form.coPassengerPhone} onChange={(e) => setForm({ ...form, coPassengerPhone: e.target.value })} placeholder="Phone number" />
                </label>
              </>
            )}
            <label className="text-xs text-ink/60">Trip note (optional)
              <textarea className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Pickup detail or extra note" />
            </label>
            {error && <p className="text-rose-500 text-sm">{error}</p>}
            <button disabled={busy} className="bg-lilac-500 disabled:opacity-60 text-white font-medium py-3 rounded-full">
              {busy ? 'Finding a driver...' : 'Book rickshaw'}
            </button>
          </form>
        </div>}

        {/* Available ride slots */}
        {homeView === 'slots' && <div className="bg-white rounded-xl2 p-5 shadow-soft border border-lilac-100">
          <BackButton />
          <p className="font-semibold text-ink mb-2">Available ride slots</p>
          <p className="text-xs text-ink/60 mb-4">Other students' pending rides with a future pickup time and a free seat appear here. Your own bookings are under Pending Requests. Updates every 4 seconds.</p>
          {openRides.length === 0
            ? <p className="text-sm text-ink/50">No eligible rides right now. To share a ride, another student must book 1 seat for a future pickup time. Bookings for 2 seats are full.</p>
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
                      <p className="text-xs text-ink/50 mt-1">Rider: {ride.host} · {publicGenderLabel(ride.hostGender)}</p>
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

        {/* Pending requests */}
        {homeView === 'pending' && <div className="bg-white rounded-xl2 p-5 shadow-soft border border-lilac-100">
          <BackButton />
          <p className="font-semibold text-ink mb-4">Pending requests</p>
          {pendingRides.length === 0
            ? <p className="text-sm text-ink/50">You don't have any pending requests.</p>
            : <div className="flex flex-col gap-3">
                {pendingRides.map((ride) => <div key={ride.id} className="border border-lilac-100 rounded-xl p-4">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-ink">{ride.from} → {ride.to}</p>
                    <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-700 capitalize">{ride.status}</span>
                  </div>
                  <p className="text-xs text-ink/50 mt-2">{formatTime(ride.requestedTime || ride.createdAt)} · {ride.seats || 1} seat{(ride.seats || 1) > 1 ? 's' : ''}</p>
                </div>)}
              </div>}
        </div>}

      </>}
      {tab === 'history' && <section><h2 className="font-display text-2xl text-ink mb-4">Ride history</h2>{pastRides.length === 0 ? <p className="text-sm text-ink/50">Your completed rides will appear here.</p> : pastRides.map((ride) => <div key={ride.id} className="bg-white rounded-xl2 p-4 mb-3 border border-lilac-100"><div className="flex justify-between"><p className="text-sm font-medium text-ink">{ride.from} → {ride.to}</p><span className="text-xs capitalize text-lilac-600">{ride.status}</span></div><p className="text-xs text-ink/50 mt-2">{formatTime(ride.requestedTime || ride.createdAt)} · {ride.seats || 1} seat{(ride.seats || 1) > 1 ? 's' : ''}</p></div>)}</section>}
      {tab === 'notifications' && <section><h2 className="font-display text-2xl text-ink mb-4">Notifications</h2>{notifications.length === 0 ? <p className="text-sm text-ink/50">No notifications yet.</p> : notifications.map((ride) => <div key={ride.id} className="bg-white rounded-xl2 p-4 mb-3 border border-lilac-100"><p className="text-sm text-ink">{ride.message}</p><p className="text-xs text-ink/50 mt-2">{ride.from} → {ride.to}</p>{ride.available && <button onClick={() => { setTab('home'); setHomeView('slots') }} className="text-sm text-lilac-600 mt-2">View available ride</button>}</div>)}</section>}
      {tab === 'profile' && <section>
        <h2 className="font-display text-2xl text-ink mb-4">Profile</h2>
        <div className="bg-white rounded-xl2 p-5 border border-lilac-100">
          {!editingProfile ? <>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-medium text-ink">{displayUser?.name}</p>
                <p className="text-sm text-ink/60 mt-1">{user?.email}</p>
              </div>
              <button onClick={() => setEditingProfile(true)} className="text-sm text-lilac-600 underline">Edit</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-5">
              <div><p className="text-xs text-ink/50">Student ID</p><p className="text-sm text-ink mt-0.5">{user?.studentId || 'Not set'}</p></div>
              <div><p className="text-xs text-ink/50">Gender</p><p className="text-sm text-ink mt-0.5">{genderLabel(displayUser?.gender)}</p></div>
              <div className="col-span-2"><p className="text-xs text-ink/50">Residence</p><p className="text-sm text-ink mt-0.5">{displayUser?.hall || 'Hall not set'}</p></div>
            </div>
            <div className="mt-5 rounded-xl bg-lilac-50 p-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-ink/60">Wallet balance</span>
                <span className="text-sm font-semibold text-ink">৳{wallet}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <input type="number" min="10" step="10" value={walletInput} onChange={(e) => setWalletInput(e.target.value)} className="w-full bg-white border border-lilac-200 rounded-xl px-3 py-2.5 text-ink" placeholder="Top-up amount" />
                <button onClick={topUpWallet} disabled={walletBusy} className="bg-lilac-500 text-white font-medium px-4 rounded-xl">{walletBusy ? '...' : 'Top up'}</button>
              </div>
            </div>
          </> : <form onSubmit={saveProfile} className="flex flex-col gap-3">
            <label className="text-xs text-ink/60">Name
              <input required className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
            </label>
            <label className="text-xs text-ink/60">Email
              <input disabled className="w-full bg-ink/5 border border-lilac-200 rounded-xl px-4 py-3 text-ink/50 mt-1" value={user?.email || ''} />
            </label>
            <label className="text-xs text-ink/60">Student ID
              <input disabled className="w-full bg-ink/5 border border-lilac-200 rounded-xl px-4 py-3 text-ink/50 mt-1" value={user?.studentId || 'Not set'} />
            </label>
            <label className="text-xs text-ink/60">Gender
              <select required className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}>
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="unknown">Prefer not to say</option>
              </select>
            </label>
            <p className="text-xs text-ink/40 -mt-1">Email and student ID are locked. Contact administration to change these.</p>
            <label className="text-xs text-ink/60">Residence
              <select className="w-full bg-lilac-50 border border-lilac-200 rounded-xl px-4 py-3 text-ink mt-1" value={profileForm.hall} onChange={(e) => setProfileForm({ ...profileForm, hall: e.target.value })}>
                <option value="">Select your hall</option>
                {HALLS.map((hall) => <option key={hall}>{hall}</option>)}
              </select>
            </label>
            <div className="flex gap-2 mt-1">
              <button type="button" onClick={() => setEditingProfile(false)} className="flex-1 bg-lilac-50 text-ink/70 font-medium py-2.5 rounded-full">Cancel</button>
              <button disabled={profileSaving} className="flex-1 bg-lilac-500 disabled:opacity-60 text-white font-medium py-2.5 rounded-full">{profileSaving ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>}
        </div>
      </section>}
    </main>
    <nav className="border-t border-lilac-100 bg-white px-4 py-3 flex justify-around text-xs text-ink/60">{nav.map(([key, label]) => <button key={key} onClick={() => { setTab(key); setHomeView('menu') }} className={tab === key ? 'text-lilac-600 font-medium' : ''}>{label}</button>)}</nav>
  </div>
}
