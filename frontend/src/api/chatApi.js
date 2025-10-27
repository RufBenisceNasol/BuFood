import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// Helper for authenticated requests
async function authedFetch(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  // Handle token refresh on 401
  if (res.status === 401) {
    await supabase.auth.refreshSession();
    const { data: { session: newSession } } = await supabase.auth.getSession();
    if (newSession?.access_token) {
      return fetch(`${API_BASE}${path}`, {
        ...opts,
        headers: {
          ...(opts.headers || {}),
          Authorization: `Bearer ${newSession.access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    }
  }
  
  return res;
}

// Chat API methods
export async function fetchConversations() {
  const r = await authedFetch('/chat/conversations');
  return r.json();
}

export async function fetchMessages(conversationId, limit = 30, cursor) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const r = await authedFetch(`/chat/messages/${conversationId}?${params.toString()}`);
  return r.json();
}

export async function createOrFetchConversation(customerId, sellerId, orderId) {
  const r = await authedFetch('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ customerId, sellerId, orderId }),
  });
  return r.json();
}

export async function sendMessageAPI(body) {
  const r = await authedFetch('/chat/messages', { 
    method: 'POST', 
    body: JSON.stringify(body) 
  });
  return r.json();
}

export async function markRead(conversationId) {
  const r = await authedFetch(`/chat/conversations/${conversationId}/read`, { 
    method: 'POST' 
  });
  return r.json();
}

// Export supabase client for other components
export { supabase };
