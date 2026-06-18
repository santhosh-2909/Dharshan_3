/**
 * Aalayam API Client
 * Connects to the temple backend at /api/v1
 */

const API_BASE = "/api/v1";
const TOKEN_KEY = "aalayam.token";
const USER_KEY = "aalayam.user";

const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const userStore = {
  get: () => {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  },
  set: (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clear: () => localStorage.removeItem(USER_KEY),
};

async function request(path, { method = "GET", body, auth = false, base = API_BASE } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${base}${path}`, {
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

const api = {
  // Auth
  register: (data) => request("/auth/register", { method: "POST", body: data }),
  login: (data) => request("/auth/login", { method: "POST", body: data }),
  me: () => request("/auth/me", { auth: true }),

  // Temple
  temples: () => request("/temple"),
  temple: (slug) => request(`/temple/${slug}`),

  // Events
  events: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/events${qs ? "?" + qs : ""}`);
  },
  festivalSurge: () => request("/events/surge"),

  // Crowd
  crowd: () => request("/crowd/dashboard"),

  // Stats
  landingStats: () => request("/stats/landing"),

  // Bookings
  sevas: () => request("/bookings/sevas"),
  availability: (sevaId, on) => request(`/bookings/sevas/${sevaId}/availability?on=${on}`),
  myBookings: () => request("/bookings/me", { auth: true }),
  createBooking: (data) => request("/bookings", { method: "POST", body: data, auth: true }),
  bookingCheckout: (id) => request(`/bookings/${id}/checkout`, { method: "POST", auth: true }),
  bookingStats: () => request("/bookings/stats"),

  // Donations
  causes: () => request("/donations/causes"),
  donate: (data) => request("/donations", { method: "POST", body: data, auth: true }),
  donationCheckout: (id) => request(`/donations/${id}/checkout`, { method: "POST", auth: true }),
  recentDonations: () => request("/donations/recent"),

  // Parking
  parkingLots: () => request("/parking/lots"),
  parkingLot: (slug) => request(`/parking/lots/${slug}`),
  parkingActive: (lotId) => request(`/parking/active${lotId ? "?lot_id=" + lotId : ""}`),
  parkingEntry: (data) => request("/parking/entry", { method: "POST", body: data, auth: true }),
  parkingExit: (id) => request(`/parking/exit/${id}`, { method: "POST", auth: true }),
  parkingStats: () => request("/parking/stats"),

  // CCTV
  cctvStats: () => request("/cctv/stats"),
  cctvRecent: (limit = 30) => request(`/cctv/recent?limit=${limit}`),

  // Prediction
  predict: (target_date) => request("/predict", { method: "POST", body: { target_date } }),

  // Queue & Staffing
  queueWait: (openIds) => request(`/queue${openIds && openIds.length ? "?open=" + openIds.join(",") : ""}`),
  staffing: (hours = 6) => request(`/staffing?hours=${hours}`),

  // Anomaly
  anomalyStatus: () => request("/anomaly"),
  anomalyCheck: (actual_count, source = "manual") => request("/anomaly", { method: "POST", body: { actual_count, source } }),

  // History
  history: (limit = 90) => request(`/history?limit=${limit}`),
  historySnapshot: () => request("/history/snapshot", { method: "POST" }),

  // Final Report
  finalReport: () => request("/final-report"),

  // Feedback
  feedbackList: () => request("/feedback"),
  submitFeedback: (data) => request("/feedback", { method: "POST", body: data, auth: true }),

  // FAQ
  faq: () => request("/faq"),

  // Live crowd (different base)
  liveCrowd: () => request("/crowd/live", { base: "/api" }),
  crowdStatus: () => request("/crowd/status", { base: "/api" }),
  crowdHeatmap: () => request("/crowd/heatmap", { base: "/api" }),
  crowdToday: () => request("/crowd/today", { base: "/api" }),
  cameraStart: () => request("/crowd/camera/start", { method: "POST", base: "/api" }),
  cameraStop: () => request("/crowd/camera/stop", { method: "POST", base: "/api" }),
};

// Export for use in pages
window.Aalayam = { api, tokenStore, userStore };
