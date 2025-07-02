/**
 * Cross-Origin Resource Sharing (CORS) helper for Supabase Edge Functions
 */

// Define the Request and Response types for compatibility with both browser and Deno
interface RequestLike {
  headers: {
    get(name: string): string | null;
  };
  method: string;
}

interface ResponseLike {
  body: ReadableStream | null;
  status: number;
  statusText: string;
  headers: Headers;
}

// Define allowed origins - add your localhost and production URLs
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
      'https://orangecat.ch'
];

/**
 * Generate CORS headers based on the request's origin
 * @param req The incoming request
 * @returns Appropriate CORS headers
 */
export function getCorsHeaders(req: RequestLike): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  
  // Check if the origin is in our allowed list
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, origin, accept, x-requested-with'
  };
}

/**
 * Handle CORS preflight requests
 * @param req The incoming request
 * @returns Response for OPTIONS preflight requests
 */
export function handleCorsPreflightRequest(req: RequestLike): ResponseLike | null {
  // Return early if not an OPTIONS request
  if (req.method !== 'OPTIONS') {
    return null;
  }
  
  // Handle CORS preflight request
  // @ts-ignore - Ignore for browser compatibility
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req)
  });
}

/**
 * Add CORS headers to a response
 * @param response The response to add headers to
 * @param req The original request
 * @returns A new response with CORS headers
 */
export function addCorsHeaders(response: ResponseLike, req: RequestLike): ResponseLike {
  const corsHeaders = getCorsHeaders(req);
  
  // Create a new response with the original response's body and status, but with CORS headers
  const newHeaders = new Headers(response.headers);
  
  // Add each CORS header
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  // @ts-ignore - Ignore for browser compatibility
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
} 