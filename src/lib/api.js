// Thin fetch wrapper for the local Express + SQLite backend (server/index.js). Every
// call here hits a real endpoint backed by real persisted rows — there is no mock data
// layer behind this file. `getUserId` is injected by AppStateContext per-session (see
// createSession in state/session.js) so two panes in Live Demo can act as two different
// signed-in accounts without sharing one browser's storage.
async function request(path, { method = 'GET', body, userId } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty body
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (userId) => request('/auth/me', { userId }),
  deleteAccount: (userId) => request('/auth/account', { method: 'DELETE', userId }),

  getDriver: (id) => request(`/drivers/${id}`),
  listDrivers: () => request('/drivers'),
  registerVehicle: (id, payload) => request(`/drivers/${id}/vehicle`, { method: 'POST', body: payload }),
  uploadDocument: (id, payload) => request(`/drivers/${id}/documents`, { method: 'POST', body: payload }),
  submitForReview: (id) => request(`/drivers/${id}/submit`, { method: 'POST' }),
  verifyDriver: (id, status) => request(`/drivers/${id}/verify`, { method: 'PATCH', body: { status } }),
  setDriverOnline: (id, isOnline) => request(`/drivers/${id}/online`, { method: 'PATCH', body: { isOnline } }),
  updateDriverProfile: (id, payload) => request(`/drivers/${id}/profile`, { method: 'PATCH', body: payload }),

  getCustomer: (id) => request(`/customers/${id}`),
  updateCustomerProfile: (id, payload) => request(`/customers/${id}/profile`, { method: 'PATCH', body: payload }),

  createTrip: (payload) => request('/trips', { method: 'POST', body: payload }),
  nextRequest: () => request('/trips/next-request'),
  activeTrip: (role, userId) => request(`/trips/active?role=${role}&userId=${userId}`),
  tripHistory: (role, userId) => request(`/trips?role=${role}&userId=${userId}`),
  getTrip: (id) => request(`/trips/${id}`),
  acceptTrip: (id, driverId) => request(`/trips/${id}/accept`, { method: 'POST', body: { driverId } }),
  updateTracking: (id, trackingState) => request(`/trips/${id}/tracking`, { method: 'PATCH', body: { trackingState } }),
  cancelTrip: (id) => request(`/trips/${id}/cancel`, { method: 'POST' }),
  completeTrip: (id, rating) => request(`/trips/${id}/complete`, { method: 'POST', body: { rating } }),

  listTransactions: (userId) => request(`/transactions?userId=${userId}`),
  topUp: (userId, amount, method) => request('/transactions/topup', { method: 'POST', body: { userId, amount, method } }),
  withdraw: (userId, amount, method) => request('/transactions/withdraw', { method: 'POST', body: { userId, amount, method } }),
  refundTransaction: (id) => request(`/transactions/${id}/refund`, { method: 'POST' }),

  listPaymentMethods: (userId) => request(`/payment-methods?userId=${userId}`),
  addPaymentMethod: (payload) => request('/payment-methods', { method: 'POST', body: payload }),

  adminDashboard: () => request('/admin/dashboard'),
  adminReports: () => request('/admin/reports'),
  adminTrips: () => request('/admin/trips'),
  adminTrip: (id) => request(`/admin/trips/${id}`),
  adminTransactions: () => request('/admin/transactions'),
  adminListCustomers: () => request('/admin/customers'),
  adminGetCustomer: (id) => request(`/admin/customers/${id}`),
  adminCreateCustomer: (payload) => request('/admin/customers', { method: 'POST', body: payload }),
  adminUpdateCustomer: (id, payload) => request(`/admin/customers/${id}`, { method: 'PATCH', body: payload }),
  adminCreateDriver: (payload) => request('/admin/drivers', { method: 'POST', body: payload }),
};
