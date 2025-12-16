import { KintoneRestAPIClient } from "@kintone/rest-api-client";

// Get client with support for multiple API tokens
// apiTokens: string | string[]
export const getKintoneClient = (subdomain, apiTokens) => {
  if (!subdomain || !apiTokens) return null;

  // Ensure apiTokens is an array unique and filtered
  const tokens = Array.isArray(apiTokens) ? apiTokens : [apiTokens];
  const validTokens = tokens.filter(t => t && t.trim() !== '');

  if (validTokens.length === 0) return null;

  // Determine Base URL
  // Local Dev (Vite): Use window.location.origin (proxies /k/v1 -> cybozu via vite.config.js)
  // Production (Verification/Vercel): Use /api/kintone/SUBDOMAIN (proxies via vercel.json)

  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Note: KintoneRestAPIClient appends /k/v1 to the baseUrl.
  // We want the final URL to be: /api/kintone/{subdomain}/k/v1/...
  const baseUrl = isLocalDev
    ? window.location.origin
    : `${window.location.origin}/api/kintone/${subdomain}`;

  return new KintoneRestAPIClient({
    baseUrl: baseUrl,
    auth: { apiToken: validTokens },
  });
};
