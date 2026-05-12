import axios from 'axios';
import crypto from 'crypto';

// In-memory store for PKCE verifiers
const verifierStore = new Map();

// Generate PKCE code verifier
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

// Generate PKCE code challenge
async function generateCodeChallenge(verifier) {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64url');
}

/**
 * Step 1: Redirect user to Deriv's OAuth authorization page
 */
export async function redirectToDeriv(req, res) {
  try {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = crypto.randomUUID();
    
    verifierStore.set(state, { codeVerifier, createdAt: Date.now() });
    setTimeout(() => verifierStore.delete(state), 10 * 60 * 1000); // Increased to 10 minutes
    
    const authUrl = new URL('https://auth.deriv.com/oauth2/auth');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', process.env.DERIV_APP_ID);
    authUrl.searchParams.set('redirect_uri', process.env.DERIV_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'trade');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    
    console.log('Redirecting to Deriv OAuth URL:', authUrl.toString());
    res.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('OAuth redirect error:', error);
    res.status(500).json({ error: 'Failed to initiate login' });
  }
}

/**
 * Step 2: Handle OAuth callback from Deriv
 */
export async function handleCallback(req, res) {
  const { code, state } = req.query;
  
  console.log('=== OAuth Callback Received ===');
  console.log('Code present:', !!code);
  console.log('State present:', !!state);
  console.log('Full URL:', req.url);
  
  // Prevent duplicate processing - check if already processed
  if (req.session?.processed) {
    console.log('Callback already processed, skipping...');
    return;
  }
  
  if (!code || !state) {
    console.error('Missing code or state');
    return res.redirect(`${process.env.FRONTEND_URL}/auth-error?message=Missing code or state`);
  }
  
  const sessionData = verifierStore.get(state);
  if (!sessionData) {
    console.error('Invalid or expired state');
    return res.redirect(`${process.env.FRONTEND_URL}/auth-error?message=Invalid or expired state`);
  }
  
  // Mark as processed to prevent duplicate handling
  if (req.session) req.session.processed = true;
  verifierStore.delete(state);
  
  try {
    console.log('Exchanging code for token...');
    
    const tokenResponse = await axios.post(
      'https://auth.deriv.com/oauth2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.DERIV_APP_ID,
        code: code,
        redirect_uri: process.env.DERIV_REDIRECT_URI,
        code_verifier: sessionData.codeVerifier
      }),
      {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('Token exchange successful!');
    
    const { access_token, expires_in, refresh_token } = tokenResponse.data;
    
    // Clear any existing cookies first
    res.clearCookie('deriv_access_token', { path: '/' });
    res.clearCookie('is_authenticated', { path: '/' });
    
    // Set HTTP-only cookies with proper settings for localhost
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('deriv_access_token', access_token, {
      httpOnly: true,
      secure: false, // Set to false for localhost development
      sameSite: 'lax',
      maxAge: expires_in * 1000,
      path: '/'
    });
    
    res.cookie('is_authenticated', 'true', {
      httpOnly: false,
      secure: false, // Set to false for localhost development
      sameSite: 'lax',
      maxAge: expires_in * 1000,
      path: '/'
    });
    
    if (refresh_token) {
      res.cookie('deriv_refresh_token', refresh_token, {
        httpOnly: true,
        secure: false, // Set to false for localhost development
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/'
      });
    }
    
    // Redirect back to Angular frontend dashboard
    const redirectUrl = `${process.env.FRONTEND_URL}/dashboard`;
    console.log('Redirecting to:', redirectUrl);
    
    // Use 302 redirect
    res.status(302).redirect(redirectUrl);
    
  } catch (error) {
    console.error('Token exchange failed:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/auth-error?message=Authentication failed`);
  }
}

/**
 * Get current user info
 */
export async function getUserInfo(req, res) {
  const token = req.cookies.deriv_access_token;
  
  console.log('getUserInfo called, token present:', !!token);
  
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }
  
  try {
    const response = await axios.get('https://api.deriv.com/account/v1/status', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Deriv-App-ID': process.env.DERIV_APP_ID
      }
    });
    
    res.json({ 
      authenticated: true, 
      user: response.data,
      email: response.data?.email
    });
  } catch (error) {
    console.error('Get user info failed:', error.response?.data || error.message);
    res.clearCookie('deriv_access_token', { path: '/' });
    res.clearCookie('is_authenticated', { path: '/' });
    res.status(401).json({ authenticated: false, error: 'Token invalid or expired' });
  }
}

/**
 * Logout
 */
export function logout(req, res) {
  console.log('Logout called');
  res.clearCookie('deriv_access_token', { path: '/' });
  res.clearCookie('deriv_refresh_token', { path: '/' });
  res.clearCookie('is_authenticated', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully' });
}

/**
 * Refresh token
 */
export async function refreshToken(req, res) {
  const refreshToken = req.cookies.deriv_refresh_token;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token available' });
  }
  
  try {
    const response = await axios.post(
      'https://auth.deriv.com/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.DERIV_APP_ID,
        refresh_token: refreshToken
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    
    const { access_token, expires_in } = response.data;
    
    res.cookie('deriv_access_token', access_token, {
      httpOnly: true,
      secure: false, // Set to false for localhost development
      sameSite: 'lax',
      maxAge: expires_in * 1000,
      path: '/'
    });
    
    res.cookie('is_authenticated', 'true', {
      httpOnly: false,
      secure: false, // Set to false for localhost development
      sameSite: 'lax',
      maxAge: expires_in * 1000,
      path: '/'
    });
    
    res.json({ success: true, expires_in });
    
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data || error.message);
    res.status(401).json({ error: 'Failed to refresh token' });
  }
}