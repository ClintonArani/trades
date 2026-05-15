import axios from "axios";
import crypto from "crypto";

// In-memory store for PKCE verifiers
// Note: This will not persist across server restarts on Render
// For production with multiple instances, consider using Redis
const verifierStore = new Map();

// Clean up expired verifiers every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [state, data] of verifierStore.entries()) {
      if (now - data.createdAt > 10 * 60 * 1000) {
        verifierStore.delete(state);
      }
    }
  },
  5 * 60 * 1000,
);

// Generate PKCE code verifier
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

// Generate PKCE code challenge
async function generateCodeChallenge(verifier) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return hash.toString("base64url");
}

/**
 * Step 1: Redirect user to Deriv's OAuth authorization page
 */
export async function redirectToDeriv(req, res) {
  try {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = crypto.randomUUID();

    verifierStore.set(state, {
      codeVerifier,
      createdAt: Date.now(),
    });

    // Clean up after 10 minutes
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

/**
 * Step 2: Handle OAuth callback from Deriv
 */
export async function handleCallback(req, res) {
  const { code, state } = req.query;

  console.log("OAuth Callback received at:", new Date().toISOString());
  console.log("Code present:", !!code, "State present:", !!state);

  // Prevent duplicate processing
  if (req.session?.processed) {
    console.log("Callback already processed");
    return;
  }

  if (!code || !state) {
    console.error("Missing code or state");
    const frontendUrl =
      process.env.FRONTEND_URL || "https://wisetrades.netlify.app";
    return res.redirect(
      `${frontendUrl}/auth-error?message=Missing+code+or+state`,
    );
  }

  const sessionData = verifierStore.get(state);
  if (!sessionData) {
    console.error("Invalid or expired state");
    const frontendUrl =
      process.env.FRONTEND_URL || "https://wisetrades.netlify.app";
    return res.redirect(
      `${frontendUrl}/auth-error?message=Invalid+or+expired+state`,
    );
  }

  // Mark as processed to prevent duplicate handling
  if (req.session) req.session.processed = true;
  verifierStore.delete(state);

  try {
    console.log("Token exchange successful, setting cookies...");

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
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000, // 10 second timeout
      },
    );

    console.log("Token exchange successful, setting cookies...");

    const { access_token, expires_in, refresh_token } = tokenResponse.data;

    // Clear existing cookies
    res.clearCookie("deriv_access_token", { path: "/" });
    res.clearCookie("is_authenticated", { path: "/" });

    // Determine if we're in production
    const isProduction = process.env.NODE_ENV === "production";

    // Set cookies with proper production settings
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // true in production (HTTPS on Render)
      sameSite: "lax",
      path: "/",
    };

    // Set cookies
    res.cookie("deriv_access_token", access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: expires_in * 1000,
    });

    res.cookie("is_authenticated", "true", {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: expires_in * 1000,
    });

    if (refresh_token) {
      res.cookie("deriv_refresh_token", refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }

    // Redirect to frontend dashboard
    const frontendUrl =
      process.env.FRONTEND_URL || "https://wisetrades.netlify.app";

    // Add a timestamp to prevent caching issues
    const redirectUrl = `${frontendUrl}/dashboard?auth_success=true&t=${Date.now()}`;
    console.log("Redirecting to:", redirectUrl);

    res.redirect(redirectUrl);
  } catch (error) {
    console.error(
      "Token exchange failed:",
      error.response?.data || error.message,
    );
    const frontendUrl =
      process.env.FRONTEND_URL || "https://wisetrades.netlify.app";
    res.redirect(`${frontendUrl}/auth-error?message=Authentication+failed`);
  }
}

/**
 * Get current user info
 */
export async function getUserInfo(req, res) {
  const token = req.cookies.deriv_access_token;

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const response = await axios.get(
      "https://api.deriv.com/account/v1/status",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Deriv-App-ID": process.env.DERIV_APP_ID,
        },
        timeout: 10000,
      },
    );

    res.json({
      authenticated: true,
      user: response.data,
      email: response.data?.email,
      token: token, // ✅ Return the token to frontend
    });
  } catch (error) {
    console.error(
      "Get user info failed:",
      error.response?.data || error.message,
    );
    res.clearCookie("deriv_access_token", { path: "/" });
    res.clearCookie("is_authenticated", { path: "/" });
    res
      .status(401)
      .json({ authenticated: false, error: "Token invalid or expired" });
  }
}

/**
 * Logout
 */
export function logout(req, res) {
  console.log("Logout called");

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "none", // Change from 'lax' to 'none' for cross-site requests
    path: "/",
    domain: isProduction ? ".onrender.com" : undefined, // Add this for production
  };

  res.clearCookie("deriv_access_token", cookieOptions);
  res.clearCookie("deriv_refresh_token", cookieOptions);
  res.clearCookie("is_authenticated", cookieOptions);

  res.json({ success: true, message: "Logged out successfully" });
}

/**
 * Refresh token
 */
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
      },
    );

    const { access_token, expires_in } = response.data;

    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: expires_in * 1000,
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

    res.json({ success: true, expires_in });
  } catch (error) {
    console.error(
      "Token refresh failed:",
      error.response?.data || error.message,
    );
    res.status(401).json({ error: "Failed to refresh token" });
  }
}
