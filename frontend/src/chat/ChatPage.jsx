import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { chat } from '../api';

const ChatPage = ({ conversationId: propConversationId, recipientId: propRecipientId, title = 'Chat' }) => {
  const { conversationId: routeConversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialRecipientId = useMemo(() => (location.state && location.state.recipientId) || propRecipientId || '', [location.state, propRecipientId]);
  const [conversationId, setConversationId] = useState(propConversationId || routeConversationId || '');
  const [recipientId, setRecipientId] = useState(initialRecipientId);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [meta, setMeta] = useState(null);
  const pollRef = useRef(null);
  const scrollRef = useRef(null);

  const headerTitle = (location.state && location.state.title) || title;
  const headerAvatar = (location.state && location.state.avatar) || null;

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const loadMessages = async (silent = false) => {
    if (!conversationId) return;
    try {
      if (!silent) setLoading(true);
      const res = await chat.getMessages(conversationId);
      let arr = res.data || res;
      let metaPayload = null;
      if (arr && typeof arr === 'object' && Array.isArray(arr.data)) {
        metaPayload = arr.meta || null;
        arr = arr.data;
      }
      setMessages(Array.isArray(arr) ? arr : (arr?.data || []));
      if (metaPayload) {
        setMeta(metaPayload);
      }
      if (!silent) setTimeout(scrollToBottom, 0);
    } catch (_) {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // start polling
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(true), 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [conversationId]);

  useEffect(() => {
    // initial fetch if conversationId provided
    if (conversationId) loadMessages();
  }, [conversationId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const body = { text };
      if (conversationId) body.conversationId = conversationId;
      else if (recipientId) body.recipientId = recipientId;
      const res = await chat.sendMessage(body);
      const msg = res.data?.message || res.data?.data?.message || res?.message;
      const convo = res.data?.conversation || res.data?.data?.conversation || res?.conversation;
      if (!conversationId && convo?._id) {
        setConversationId(convo._id);
      }
      if (msg) setMessages(prev => [...prev, msg]);
      setDraft('');
      setTimeout(scrollToBottom, 0);
    } catch (_) {
      // optionally show toast
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0c0f1a', color: '#e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#111827', color: '#e5e7eb', position: 'sticky', top: 0, zIndex: 5, boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontWeight: 700, cursor: 'pointer', fontSize: 20 }}>&larr;</button>
        {(meta?.counterpart?.avatar || headerAvatar) ? (
          <img src={meta?.counterpart?.avatar || headerAvatar} alt={meta?.counterpart?.name || headerTitle || 'User'} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(59,130,246,0.4)' }} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(148,163,184,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {(meta?.counterpart?.name || headerTitle || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{meta?.counterpart?.name || headerTitle}</div>
          {(meta?.customer || meta?.seller) && (
            <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.9)' }}>
              {meta?.customer?.name && meta?.seller?.name
                ? `${meta.customer.name} • ${meta.seller.name}`
                : meta?.customer?.name || meta?.seller?.name}
            </div>
          )}
        </div>
      </div>

      {meta?.orderSummary?.items?.length > 0 && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(148,163,184,0.12)', background: '#0f172a' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#9ca3af' }}>Ordered Items</div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: 10 }}>
            {meta.orderSummary.items.map((item) => (
              <div key={`${item.productId}-${item.optionName}`} style={{ minWidth: 96, border: '1px solid rgba(148,163,184,0.18)', borderRadius: 12, padding: 8, background: '#111827' }}>
                <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', background: '#1f2937', marginBottom: 6 }}>
                  {item.image ? (
                    <img src={item.image} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 12 }}>No Image</div>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#e2e8f0' }}>{item.productName}</div>
                {(item.variantName || item.optionName) && (
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{[item.variantName, item.optionName].filter(Boolean).join(' • ')}</div>
                )}
                <div style={{ fontSize: 11, marginTop: 4, color: '#cbd5f5' }}>Qty: {item.quantity}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div style={{ color: '#94a3b8', padding: '8px 0' }}>Loading messages...</div>}
        {!loading && messages.map((m) => {
          const mine = meta?.self?.id && String(m.senderId) === String(meta.self.id);
          return (
            <div key={m._id || m.createdAt || Math.random()} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  background: mine ? '#2563eb' : '#1f2937',
                  color: mine ? '#e0f2fe' : '#e2e8f0',
                  borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '10px 14px',
                  maxWidth: '72%',
                  boxShadow: '0 6px 14px rgba(15, 23, 42, 0.45)',
                  border: mine ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(30,41,59,0.7)'
                }}
              >
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
                <div style={{ fontSize: 11, color: mine ? 'rgba(226,232,240,0.75)' : '#94a3b8', marginTop: 6, textAlign: 'right' }}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, padding: 12, borderTop: '1px solid rgba(148,163,184,0.12)', background: '#0f172a' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message..."
          style={{ flex: 1, border: '1px solid rgba(148,163,184,0.2)', background: '#111827', color: '#e5e7eb', borderRadius: 999, padding: '12px 16px', fontSize: 14 }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          style={{
            background: '#2563eb',
            color: '#e0f2fe',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 999,
            fontWeight: 700,
            cursor: sending ? 'not-allowed' : 'pointer',
            opacity: (!draft.trim() || sending) ? 0.5 : 1,
            transition: 'transform 0.15s ease'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
