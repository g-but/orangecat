// Follow Deno's Supabase Edge Function format
// @ts-ignore - Ignore for Deno compatibility
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.js';

// Type definitions for Deno environment
declare global {
  interface DenoNamespace {
    serve(handler: (request: Request) => Response | Promise<Response>): void;
    env: {
      get(key: string): string | undefined;
    };
  }

  const Deno: DenoNamespace;
}

// Supabase project URL (same as in your client)
const SUPABASE_URL = typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_URL') || '' 
  : process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_ANON_KEY') || '' 
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log startup
console.log('CORS Proxy Function initialized');

// Define the handler function that works both with Deno and regular TypeScript
const handleRequest = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) {
    return preflightResponse as Response;
  }

  try {
    // Parse request info
    const url = new URL(req.url);
    const origin = req.headers.get('Origin') || '';
    const targetPath = url.searchParams.get('path') || '/rest/v1/auth';
    
    // Build the target URL for the Supabase API
    const targetUrl = `${SUPABASE_URL}${targetPath}`;
    
    // Create new request, copying method, headers, and body from original
    const newHeaders = new Headers(req.headers);
    
    // Add Supabase specific headers
    newHeaders.set('apikey', SUPABASE_ANON_KEY);
    
    // Auth header from original request or default to anon key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      newHeaders.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
    }
    
    // Forward the request to Supabase
    const supabaseResponse = await fetch(targetUrl, {
      method: req.method,
      headers: newHeaders,
      body: req.body && req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    });
    
    // Read the response
    const responseData = await supabaseResponse.text();
    
    // Create a new response with CORS headers
    return new Response(responseData, {
      status: supabaseResponse.status,
      statusText: supabaseResponse.statusText,
      headers: {
        ...Object.fromEntries(supabaseResponse.headers),
        ...getCorsHeaders(req),
        'Content-Type': supabaseResponse.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error: unknown) {
    console.error('CORS Proxy error:', error);
    
    // Return error with CORS headers
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(req),
        },
      }
    );
  }
};

// Export for Node.js environments
export default handleRequest;

// Call Deno.serve in Deno environments
if (typeof Deno !== 'undefined') {
  Deno.serve(handleRequest);
} 