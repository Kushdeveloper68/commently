import axios from "axios";

const GRAPH_BASE = "https://graph.instagram.com/v23.0"; // versioned endpoints (me, media, messages)
const GRAPH_HOST = "https://graph.instagram.com";        // access_token / refresh_access_token — NO version
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
      "instagram_business_content_publish",
      "instagram_business_manage_insights",
    ].join(","),
    response_type: "code",
    state,
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
  try {
    const { data } = await axios.get(`${GRAPH_HOST}/access_token`, {
      params: {
        grant_type: "ig_exchange_token",
        client_secret: process.env.META_APP_SECRET,
        access_token: shortLivedToken,
      },
    });
    return data;
  } catch (err) {
    console.error("🔴 LONG-LIVED EXCHANGE FAILED");
    console.error("URL hit:", err.config?.url);
    console.error("Params sent:", err.config?.params);
    console.error("Status:", err.response?.status);
    console.error("Full error:", err.response?.data || err.message);
    throw err;
  }
}

// Refreshes a long-lived token before it expires (call via a scheduled job)
export async function refreshLongLivedToken(currentToken) {
  const { data } = await axios.get(`${GRAPH_HOST}/refresh_access_token`, {  // GRAPH_HOST, not GRAPH_BASE
    params: {
      grant_type: "ig_refresh_token",
      access_token: currentToken,
    },
  });
  return data;
}

export async function getInstagramProfile(accessToken) {
  const { data } = await axios.get(`${GRAPH_BASE}/me`, {
    params: {
      fields: "id,user_id,username,profile_picture_url,account_type",
      access_token: accessToken,
    },
  });
  console.log(data)
  return data;
}

// Subscribes this specific IG account to receive webhook events for our app
export async function subscribeAccountToWebhooks(accessToken) {
  const { data } = await axios.post(
    `${GRAPH_BASE}/me/subscribed_apps`,
    {
      subscribed_fields: "comments,messages,messaging_postbacks",
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  return data; // { success: true }
}

export async function getRecentMedia(accessToken, limit = 12) {
  const { data } = await axios.get(`${GRAPH_BASE}/me/media`, {
    params: {
      fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
      limit,
      access_token: accessToken,
    },
  });
  return data.data;
}

export async function sendPrivateReply(accessToken, commentId, message) {
  const url = `${GRAPH_BASE}/me/messages`;

  const { data } = await axios.post(
    url,
    {
      recipient: {
        comment_id: commentId,
      },
      message: {
        text: message,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  return data;
}

export async function sendPublicReply(accessToken, commentId, message) {
  const url = `${GRAPH_BASE}/${commentId}/replies`;

  const { data } = await axios.post(
    url,
    {
      message,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  return data;
}
