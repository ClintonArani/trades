import axios from "axios";
import crypto from "crypto";

// In-memory store for PKCE verifiers
const verifierStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [state, data] of verifierStore.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      verifierStore.delete(state);
    }
  }
}, 5 * 60 * 1000);

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

async function generateCodeChallenge(verifier) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return hash.toString("base64url");
}

export async function redirectToDeriv(req, res) {
  try {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = crypto.randomUUID();

    verifierStore.set(state, { codeVerifier, createdAt: Date.now() });
    setTimeout(() => verifierStore.delete(state), 10 * 60 * 1000);

    const authUrl = new URL("https://auth.deriv.com/oauth2/auth");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", process.env.DERIV_APP_ID);
    authUrl.searchParams.set("redirect_uri", process.env.DERIV_REDIRECT_URI);
    authUrl.searchParams.set("scope", "trade");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    console.log("Redirecting to Deriv OAuth");
    res.redirect(authUrl.toString());
  } catch (error) {
    console.error("OAuth redirect error:", error);
    res.status(500).json({ error: "Failed to initiate login" });
  }
}

export async function handleCallback(req, res) {
  const { code, state } = req.query;

  console.log("OAuth Callback received at:", new Date().toISOString());

  if (req.session?.processed) {
    console.log("Callback already processed");
    return;
  }

  if (!code || !state) {
    console.error("Missing code or state");
    const frontendUrl = process.env.FRONTEND_URL || "https://wisetrades.netlify.app";
    return res.redirect(`${frontendUrl}/auth-error?message=Missing+code+or+state`);
  }

  const sessionData = verifierStore.get(state);
  if (!sessionData) {
    console.error("Invalid or expired state");
    const frontendUrl = process.env.FRONTEND_URL || "https://wisetrades.netlify.app";
    return res.redirect(`${frontendUrl}/auth-error?message=Invalid+or+expired+state`);
  }

  if (req.session) req.session.processed = true;
  verifierStore.delete(state);

  try {
    const tokenResponse = await axios.post(
      "https://auth.deriv.com/oauth2/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.DERIV_APP_ID,
        code: code,
        redirect_uri: process.env.DERIV_REDIRECT_URI,
        code_verifier: sessionData.codeVerifier,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    console.log("Token exchange successful");

    const { access_token, expires_in, refresh_token } = tokenResponse.data;

    res.clearCookie("deriv_access_token", { path: "/" });
    res.clearCookie("is_authenticated", { path: "/" });

    const isProduction = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    };

    res.cookie("deriv_access_token", access_token, {
      ...cookieOptions,
      maxAge: expires_in * 1000,
    });

    res.cookie("is_authenticated", "true", {
      ...cookieOptions,
      httpOnly: false,
      maxAge: expires_in * 1000,
    });

    if (refresh_token) {
      res.cookie("deriv_refresh_token", refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "https://wisetrades.netlify.app";
    const redirectUrl = `${frontendUrl}/dashboard?auth_success=true&t=${Date.now()}`;
    console.log("Redirecting to:", redirectUrl);

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Token exchange failed:", error.response?.data || error.message);
    const frontendUrl = process.env.FRONTEND_URL || "https://wisetrades.netlify.app";
    res.redirect(`${frontendUrl}/auth-error?message=Authentication+failed`);
  }
}

/**
 * Get current user info - Fetches real user data from Deriv API
 */
export async function getUserInfo(req, res) {
  const token = req.cookies.deriv_access_token;
  const isAuthCookie = req.cookies.is_authenticated;

  console.log("getUserInfo called - Token exists:", !!token, "Auth cookie:", isAuthCookie);

  if (!token || isAuthCookie !== 'true') {
    return res.status(401).json({ authenticated: false, error: "No valid session" });
  }

  try {
    // Call Deriv's authorize endpoint to get user info
    // This is the correct endpoint that works with OAuth tokens
    const response = await axios.get("https://api.deriv.com/oauth2/authorize", {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        app_id: process.env.DERIV_APP_ID
      },
      timeout: 10000
    });

    console.log("Deriv API response:", response.data);

    // Extract user information from response
    const userData = response.data;
    
    res.json({
      authenticated: true,
      user: {
        email: userData?.email || userData?.account?.email || "User",
        fullName: userData?.full_name || userData?.account?.full_name,
        loginid: userData?.loginid || userData?.account?.loginid,
        currency: userData?.currency || userData?.account?.currency,
        balance: userData?.balance || userData?.account?.balance,
        account_type: userData?.account_type || userData?.account?.account_type
      },
      email: userData?.email || userData?.account?.email,
    });
  } catch (error) {
    console.error("Failed to fetch user info from Deriv:", error.response?.data || error.message);
    
    // If the API call fails, try an alternative endpoint
    try {
      // Alternative: Use the account status endpoint with proper headers
      const altResponse = await axios.post(
        "https://api.deriv.com/",
        {
          "account_status": 1,
          "req_id": Date.now()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Deriv-App-ID': process.env.DERIV_APP_ID
          },
          timeout: 10000
        }
      );
      
      console.log("Alternative API response:", altResponse.data);
      
      const userData = altResponse.data?.account_status || altResponse.data;
      
      res.json({
        authenticated: true,
        user: {
          email: userData?.email || "Deriv User",
          loginid: userData?.loginid,
          currency: userData?.currency,
          balance: userData?.balance
        },
        email: userData?.email,
      });
    } catch (altError) {
      console.error("Alternative API also failed:", altError.message);
      
      // Last resort: Return authenticated but without user details
      // The user will still be logged in
      res.json({
        authenticated: true,
        user: {
          email: "Authenticated User",
          message: "User details temporarily unavailable"
        },
        email: "user@deriv.com",
      });
    }
  }
}

export function logout(req, res) {
  console.log("Logout called");

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };

  res.clearCookie("deriv_access_token", cookieOptions);
  res.clearCookie("deriv_refresh_token", cookieOptions);
  res.clearCookie("is_authenticated", cookieOptions);

  res.json({ success: true, message: "Logged out successfully" });
}

export async function refreshToken(req, res) {
  const refreshToken = req.cookies.deriv_refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token available" });
  }

  try {
    const response = await axios.post(
      "https://auth.deriv.com/oauth2/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.DERIV_APP_ID,
        refresh_token: refreshToken,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    const { access_token, expires_in } = response.data;

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: expires_in * 1000,
    };

    res.cookie("deriv_access_token", access_token, cookieOptions);
    res.cookie("is_authenticated", "true", {
      ...cookieOptions,
      httpOnly: false,
    });

    res.json({ success: true, expires_in });
  } catch (error) {
    console.error("Token refresh failed:", error.response?.data || error.message);
    res.status(401).json({ error: "Failed to refresh token" });
  }
}