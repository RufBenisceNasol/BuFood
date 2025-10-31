import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import http from '../api/http';

// Keep Axios default Authorization header in sync with Supabase session
// Useful to reduce transient 401s and for libs that don't use our interceptor
export default function useSupabaseAxiosSync() {
  useEffect(() => {
    let mounted = true;

    const applyToken = (token) => {
      if (!mounted) return;
      if (token) {
        http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        delete http.defaults.headers.common['Authorization'];
      }
    };

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        applyToken(data?.session?.access_token || null);
      } catch (_) {}
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      applyToken(session?.access_token || null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);
}
