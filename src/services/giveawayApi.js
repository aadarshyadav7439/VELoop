// Real backend client. Same method names/shapes the pages already call
// (getCurrent, getPrize, getWinners, getPrevious, getMyStatus, join, claim)
// so GiveawayHome/GiveawayDetails don't need their call sites rewritten —
// only what happens inside each method changed, from localStorage to fetch.

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const TOKEN_KEY = "veloop_giveaway_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const isLoggedIn = () => Boolean(getToken());

// Maps backend error codes to the exact friendly copy from the spec
// (section 43) so a raw API error never reaches the UI.
const ERROR_MESSAGES = {
  GIVEAWAY_NOT_FOUND: "We couldn't find that giveaway.",
  GIVEAWAY_NOT_ACTIVE: "This giveaway isn't open for participation right now.",
  GIVEAWAY_ENDED: "This giveaway has ended. Check out the winners and get ready for the next giveaway.",
  ALREADY_PARTICIPATING: "You're already participating. You can participate again when a new giveaway event begins.",
  LOGIN_REQUIRED: "Please login to your VELOOP Rewards account before participating in this giveaway.",
  PARTICIPATION_BLOCKED: "Participation couldn't be completed right now.",
  SUSPICIOUS_ACTIVITY: "We couldn't verify this participation request. Please try again later or contact support if you believe this is an error.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  CLAIM_NOT_ALLOWED: "You don't have a prize to claim for this giveaway.",
  CLAIM_WINDOW_EXPIRED: "The claim window for this prize has expired.",
  CLAIM_ALREADY_SUBMITTED: "Your claim has already been submitted and is being processed."
  // INSUFFICIENT_*_BALANCE / VALIDATION_ERROR intentionally omitted — the
  // API's own `message` already includes the exact shortfall/field detail.
};

class ApiClientError extends Error {
  constructor(code, message, status, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, auth = false, headers = {} } = {}) {
  const finalHeaders = { "Content-Type": "application/json", ...headers };
  if (auth) {
    const token = getToken();
    if (!token) throw new ApiClientError("LOGIN_REQUIRED", ERROR_MESSAGES.LOGIN_REQUIRED, 401);
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    // Network failure (backend unreachable, offline, CORS) — never a raw
    // TypeError/stack trace reaches the UI (spec section 66).
    throw new ApiClientError("NETWORK_ERROR", "We couldn't load the giveaway information.", 0);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    const code = data.code || "UNKNOWN_ERROR";
    const message = ERROR_MESSAGES[code] || data.message || "Something went wrong. Please try again.";
    throw new ApiClientError(code, message, response.status, data.details);
  }

  return data;
}

export const giveawayApi = {
  ApiClientError,

  // --- Auth (VELOOP's real auth system replaces this in production) -----
  async register({ name, email, password }) {
    const data = await request("/auth/register", { method: "POST", body: { name, email, password } });
    setToken(data.token);
    return data.user;
  },
  async login({ email, password }) {
    const data = await request("/auth/login", { method: "POST", body: { email, password } });
    setToken(data.token);
    return data.user;
  },
  async me() {
    if (!isLoggedIn()) return null;
    const data = await request("/auth/me", { auth: true });
    return data.user;
  },
  logout() {
    clearToken();
  },

  // --- Giveaway reads ------------------------------------------------------
  async getCurrent() {
    const data = await request("/giveaways/current");
    return data.giveaway; // null when there's genuinely no current/upcoming giveaway
  },
  async getPrize(slug) {
    const data = await request(`/prizes/${slug}`);
    return data; // { prize, siblingPrizes, giveaway }
  },
  async getWinners(giveawayId) {
    const data = await request(`/giveaways/${giveawayId}/winners`, { auth: isLoggedIn() });
    return data; // { finalized, winners }
  },
  async getPrevious() {
    const data = await request("/giveaways/previous");
    return data.giveaways;
  },
  async getMyStatus(giveawayId) {
    if (!isLoggedIn()) return { joined: false, entries: 0, joinedPrizeIds: [] };
    const data = await request(`/giveaways/${giveawayId}/my-status`, { auth: true });
    return data.status;
  },
  async getMyWin(giveawayId) {
    if (!isLoggedIn()) return { won: false };
    return request(`/giveaways/${giveawayId}/my-win`, { auth: true });
  },

  // --- Participation ---------------------------------------------------
  async join(giveawayId, prizeId) {
    const data = await request(`/giveaways/${giveawayId}/join`, {
      method: "POST",
      auth: true,
      body: { prizeId },
      headers: { "Idempotency-Key": `${giveawayId}:${prizeId}:${Date.now()}` }
    });
    return data.participation;
  },

  // --- Claim -------------------------------------------------------------
  async getMyClaim(giveawayId) {
    return request(`/giveaways/${giveawayId}/my-claim`, { auth: true });
  },
  async claim(giveawayId, payload) {
    const data = await request(`/giveaways/${giveawayId}/claim`, { method: "POST", auth: true, body: payload });
    return data.claim;
  }
};
