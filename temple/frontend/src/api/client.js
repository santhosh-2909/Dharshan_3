const BASE = "/api/v1";
const TOKEN_KEY = "aalayam.token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // auth
  register: (data) => request("/auth/register", { method: "POST", body: data }),
  login: (data) => request("/auth/login", { method: "POST", body: data }),
  me: () => request("/auth/me", { auth: true }),

  // temple
  temples: () => request("/temple"),
  temple: (slug) => request(`/temple/${slug}`),

  // events
  events: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/events${qs ? "?" + qs : ""}`);
  },

  // bookings
  sevas: () => request("/bookings/sevas"),
  availability: (sevaId, on) =>
    request(`/bookings/sevas/${sevaId}/availability?on=${on}`),
  myBookings: () => request("/bookings/me", { auth: true }),
  createBooking: (data) =>
    request("/bookings", { method: "POST", body: data, auth: true }),
  bookingCheckout: (id) =>
    request(`/bookings/${id}/checkout`, { method: "POST", auth: true }),

  // donations
  causes: () => request("/donations/causes"),
  donate: (data) => request("/donations", { method: "POST", body: data, auth: true }),
  donationCheckout: (id) =>
    request(`/donations/${id}/checkout`, { method: "POST" }),
  recentDonations: () => request("/donations/recent"),

  // feedback
  feedbackList: () => request("/feedback"),
  submitFeedback: (data) => request("/feedback", { method: "POST", body: data, auth: true }),

  // faq
  faq: () => request("/faq"),

  // crowd
  crowd: () => request("/crowd/dashboard"),

  // stats
  landingStats: () => request("/stats/landing"),

  // parking
  parkingLots: () => request("/parking/lots"),
  parkingLot: (slug) => request(`/parking/lots/${slug}`),
  parkingActive: (lotId) =>
    request(`/parking/active${lotId ? `?lot_id=${lotId}` : ""}`),
  parkingEntry: (data) => request("/parking/entry", { method: "POST", body: data, auth: true }),
  parkingExit: (id) => request(`/parking/exit/${id}`, { method: "POST" }),
  parkingMine: () => request("/parking/me", { auth: true }),
  parkingStats: () => request("/parking/stats"),

  // booking stats
  bookingStats: () => request("/bookings/stats"),

  // cctv
  cctvStats: () => request("/cctv/stats"),
  cctvRecent: (limit = 30) => request(`/cctv/recent?limit=${limit}`),
  cctvIngest: (data) => request("/cctv/ingest", { method: "POST", body: data }),

  // final report
  finalReport: () => request("/final-report"),

  // prediction
  predict: (target_date) => request("/predict", { method: "POST", body: { target_date } }),
};
