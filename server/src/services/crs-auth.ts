import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../config';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Authenticate with the CRS API and retrieve a JWT token.
 * Caches the token in memory so subsequent calls reuse it until expiry.
 */
export async function login(): Promise<string> {
  const { username, password, baseUrl } = config.crs;

  if (!username || !password) {
    throw new Error('CRS_USERNAME and CRS_PASSWORD must be set in environment variables');
  }

  try {
    console.log('[CRS Auth] Logging in as:', username);
    const response = await axios.post(`${baseUrl}/users/login`, {
      username,
      password,
    });

    const token: string = response.data?.token || response.data?.id;
    if (!token) {
      throw new Error('No token returned from CRS login response');
    }

    cachedToken = token;
    // Cache token for 55 minutes (CRS tokens typically expire in 60 minutes)
    tokenExpiresAt = Date.now() + 55 * 60 * 1000;

    console.log('[CRS Auth] ✅ Login successful. Token cached for 55 minutes.');
    return token;
  } catch (error: any) {
    cachedToken = null;
    tokenExpiresAt = 0;

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.response?.data?.message || error.message;
      console.error(`[CRS Auth] ❌ Login failed (HTTP ${status}):`, message);
      throw new Error(`CRS login failed (HTTP ${status}): ${message}`);
    }
    console.error('[CRS Auth] ❌ Login failed:', error.message);
    throw new Error(`CRS login failed: ${error.message}`);
  }
}

/**
 * Returns a valid cached token or fetches a new one if expired / missing.
 */
export async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  return login();
}

/**
 * Makes an authenticated HTTP request to the CRS API.
 * Automatically injects the Bearer token and retries once on 401 (token refresh).
 */
export async function authenticatedFetch<T = any>(
  url: string,
  options: AxiosRequestConfig = {},
): Promise<AxiosResponse<T>> {
  const token = await getToken();

  const mergedOptions: AxiosRequestConfig = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await axios(url, mergedOptions);
    return response;
  } catch (error: any) {
    // If we receive a 401, the token may have expired. Refresh and retry once.
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const freshToken = await login();

      const retryOptions: AxiosRequestConfig = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${freshToken}`,
        },
      };

      return axios(url, retryOptions);
    }
    throw error;
  }
}

/**
 * Clears the cached token. Useful for testing or forced re-authentication.
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}
