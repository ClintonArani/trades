import axios from "axios";
import crypto from "crypto";

// In-memory store for PKCE verifiers
const verifierStore = new Map();

// Clean up expired verifiers every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of verifierStore.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) {
      verifierStore.delete(state);
    }
  }
}, 5 * 60 * 1000);

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
 * Get current user info - Using Deriv's official API endpoint
 */
export async function getUserInfo(req, res) {
  const token = req.cookies.deriv_access_token;
  const isAuthCookie = req.cookies.is_authenticated;

  console.log("=== getUserInfo Debug ===");
  console.log("Token exists:", !!token);
  console.log("Auth cookie:", isAuthCookie);

  if (!token || isAuthCookie !== 'true') {
    return res.status(401).json({ authenticated: false, error: "No valid session" });
  }

  // Try to decode JWT token first - Deriv's tokens contain user info
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log("JWT Payload decoded:", JSON.stringify(payload, null, 2));
      
      // Deriv's JWT typically contains email in the payload
      if (payload.email) {
        console.log("Found email in JWT:", payload.email);
        return res.json({
          authenticated: true,
          user: {
            email: payload.email,
            loginid: payload.loginid || payload.sub,
            fullName: payload.full_name,
            account_type: payload.account_type
          },
          email: payload.email,
        });
      }
    }
  } catch (decodeError) {
    console.log("Could not decode JWT:", decodeError.message);
  }

  // Using Deriv's official API endpoint from documentation: https://api.derivws.com
  try {
    console.log("Fetching user accounts from Deriv API...");
    
    // According to Deriv's OAuth documentation, use this endpoint to get user accounts
    const response = await axios.get(
      "https://api.derivws.com/trading/v1/options/accounts",
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log("Deriv API Response:", JSON.stringify(response.data, null, 2));

    if (response.data && response.data.accounts && response.data.accounts.length > 0) {
      const mainAccount = response.data.accounts.find(acc => acc.is_default) || response.data.accounts[0];
      
      return res.json({
        authenticated: true,
        user: {
          email: mainAccount.email || response.data.email,
          loginid: mainAccount.loginid,
          currency: mainAccount.currency,
          balance: mainAccount.balance,
          account_type: mainAccount.account_type,
          fullName: mainAccount.full_name
        },
        email: mainAccount.email || response.data.email,
      });
    }
  } catch (error) {
    console.error("Deriv accounts API call failed:", error.response?.data || error.message);
  }

  // Try the account status endpoint as fallback
  try {
    console.log("Trying account status endpoint...");
    
    const response = await axios.get(
      "https://api.derivws.com/account/v1/status",
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log("Account status response:", JSON.stringify(response.data, null, 2));

    if (response.data) {
      return res.json({
        authenticated: true,
        user: {
          email: response.data.email,
          loginid: response.data.loginid,
          currency: response.data.currency,
          balance: response.data.balance,
          account_type: response.data.account_type
        },
        email: response.data.email,
      });
    }
  } catch (error) {
    console.error("Account status API call failed:", error.response?.data || error.message);
  }

  // Fallback: Return authenticated with basic info
  // The user can still use the bot even without fetching details
  res.json({
    authenticated: true,
    user: {
      email: "Deriv Trader",
      message: "Authenticated successfully. User details will appear on next login."
    },
    email: "Deriv Trader",
  });
}

/**
 * Logout
 */
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