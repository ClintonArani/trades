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
    authUrl.searchParams.set("scope", "openid email profile trade");
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

  // Send a response in the duplicate callback branch
  if (req.session?.processed) {
    console.log("Callback already processed");
    return res.redirect(`${process.env.FRONTEND_URL}/?auth_error=already_processed`);
  }

  if (!code || !state) {
    console.error("Missing code or state");
    return res.redirect(`${process.env.FRONTEND_URL}/?auth_error=missing_code`);
  }

  const sessionData = verifierStore.get(state);
  if (!sessionData) {
    console.error("Invalid or expired state");
    return res.redirect(`${process.env.FRONTEND_URL}/?auth_error=expired_state`);
  }

  if (req.session) req.session.processed = true;
  verifierStore.delete(state);

  // START OF TRY-CATCH BLOCK
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

    const redirectUrl = `${process.env.FRONTEND_URL}/dashboard?auth_success=true&t=${Date.now()}`;
    console.log("Redirecting to:", redirectUrl);

    res.redirect(redirectUrl);
  } catch (error) {
    // This catch block works with the try above
    console.error("Token exchange failed:", error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/?auth_error=exchange_failed`);
  }
  // END OF TRY-CATCH BLOCK
}

/**
 * Get current user info - Using OIDC userinfo endpoint
 */
export async function getUserInfo(req, res) {
  const token = req.cookies.deriv_access_token;

  console.log("=== getUserInfo Debug ===");
  console.log("Token exists:", !!token);

  if (!token) {
    return res.status(401).json({ authenticated: false, error: "No valid session" });
  }

  // Use Deriv's OIDC userinfo endpoint
  try {
    console.log("Calling Deriv userinfo endpoint...");
    
    const response = await axios.get("https://auth.deriv.com/oauth2/userinfo", {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000,
    });

    console.log("Userinfo response:", JSON.stringify(response.data, null, 2));

    const { email, sub, name, preferred_username } = response.data;
    
    if (email || sub) {
      return res.json({
        authenticated: true,
        user: {
          email: email || preferred_username || sub,
          loginid: sub,
          fullName: name,
        },
        email: email || preferred_username || sub,
      });
    } else {
      console.warn("No email found in userinfo response");
      return res.status(401).json({ 
        authenticated: false, 
        error: "User email not found" 
      });
    }
  } catch (error) {
    console.error("Userinfo endpoint failed:", error.response?.data || error.message);
    
    // Fallback: Try to decode the JWT token (like your working version)
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log("Fallback - Decoded JWT payload:", JSON.stringify(payload, null, 2));
        
        const email = payload.email || payload.sub || payload.loginid || payload.preferred_username;
        
        if (email) {
          return res.json({
            authenticated: true,
            user: {
              email: email,
              loginid: payload.loginid || payload.sub,
              fullName: payload.name || payload.full_name,
            },
            email: email,
          });
        }
      }
    } catch (decodeError) {
      console.error("Fallback JWT decode also failed:", decodeError.message);
    }
    
    return res.status(401).json({ 
      authenticated: false, 
      error: "Unable to fetch user information" 
    });
  }
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