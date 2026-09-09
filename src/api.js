const API_ORIGIN = (import.meta.env.VITE_API_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/+$/, '')
const API_BASE = `${API_ORIGIN}/api`
function getToken() {
  return sessionStorage.getItem('csr_token')
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.')
  }
  return data
}

export const api = {
  studentSignup: (payload) => request('/auth/student/signup', { method: 'POST', body: payload }),
  studentLogin: (payload) => request('/auth/student/login', { method: 'POST', body: payload }),
  driverSignup: (payload) => request('/auth/driver/signup', { method: 'POST', body: payload }),
  driverLogin: (payload) => request('/auth/driver/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me', { auth: true }),

  routes: () => request('/rides/routes'),
  requestRide: (payload) => request('/rides/request', { method: 'POST', body: payload, auth: true }),
  myRides: () => request('/rides/mine', { auth: true }),
  openRides: () => request('/rides/open', { auth: true }),
  joinRide: (id) => request(`/rides/${id}/join`, { method: 'POST', auth: true }),
  pendingGroups: () => request('/rides/pending', { auth: true }),
  acceptRide: (rideIds) => request('/rides/accept', { method: 'POST', body: { rideIds }, auth: true }),
  completeRide: (id) => request(`/rides/${id}/complete`, { method: 'POST', auth: true }),
  myDriverRides: () => request('/rides/mine-driver', { auth: true }),
}

export { getToken }
