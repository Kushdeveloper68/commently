import axios from "axios";

const GRAPH_BASE = "https://graph.instagram.com/v21.0";
const IG_OAUTH_BASE = "https://api.instagram.com/oauth";

// Step 1: Build the URL the frontend redirects the user to for Instagram login
export function getInstagramAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: process.env.META_REDIRECT_URI,
    scope: [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments",
    ].join(","),
    response_type: "code",
    state, // CSRF protection token, tied to the logged-in user's session
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

// Step 2: Exchange the ?code= param (from redirect) for a short-lived token
export async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    grant_type: "authorization_code",
    redirect_uri: process.env.META_REDIRECT_URI,
    code,
  });

  const { data } = await axios.post(`${IG_OAUTH_BASE}/access_token`, params);
  return data; // { access_token, user_id }
}

// Step 3: Exchange short-lived token for a 60-day long-lived token
export async function exchangeForLongLivedToken(shortLivedToken) {
  const { data } = await axios.get(`${GRAPH_BASE}/access_token`, {
    params: {
      grant_type: "ig_exchange_token",
      client_secret: process.env.META_APP_SECRET,
      access_token: shortLivedToken,
    },
  });
  return data; // { access_token, token_type, expires_in }
}

// Refreshes a long-lived token before it expires (call via a scheduled job)
export async function refreshLongLivedToken(currentToken) {
  const { data } = await axios.get(`${GRAPH_BASE}/refresh_access_token`, {
    params: {
      grant_type: "ig_refresh_token",
      access_token: currentToken,
    },
  });
  return data;
}

export async function getInstagramProfile(accessToken) {
  const { data } = await axios.get(`${GRAPH_BASE}/me`, {
    params: { fields: "id,username,profile_picture_url", access_token: accessToken },
  });
  return data;
}

export async function getRecentMedia(accessToken, igBusinessId, limit = 12) {
  const { data } = await axios.get(`${GRAPH_BASE}/${igBusinessId}/media`, {
    params: {
      fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
      limit,
      access_token: accessToken,
    },
  });
  return data.data;
}

export async function sendPrivateReply(accessToken, commentId, message) {
  const url = `${GRAPH_BASE}/${commentId}/private_replies`;
  const { data } = await axios.post(url, null, {
    params: { message, access_token: accessToken },
  });
  return data;
}

export async function sendPublicReply(accessToken, commentId, message) {
  const url = `${GRAPH_BASE}/${commentId}/replies`;
  const { data } = await axios.post(url, null, {
    params: { message, access_token: accessToken },
  });
  return data;
}
