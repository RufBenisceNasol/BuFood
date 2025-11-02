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
  const pollRef = useRef(null);
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const loadMessages = async (silent = false) => {
    if (!conversationId) return;
    try {
      if (!silent) setLoading(true);
      const res = await chat.getMessages(conversationId);
      const arr = res.data || res;
      setMessages(Array.isArray(arr) ? arr : (arr?.data || []));
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#ff7a00', color: '#fff', position: 'sticky', top: 0 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>&larr;</button>
        <div style={{ fontWeight: 700 }}>{title}</div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {loading && <div style={{ color: '#777', padding: '8px 0' }}>Loading messages...</div>}
        {!loading && messages.map(m => (
          <div key={m._id || Math.random()} style={{ display: 'flex', justifyContent: 'flex-start', margin: '6px 0' }}>
            <div style={{
              marginLeft: String(m.senderId) === String(m.receiverId) ? 'auto' : 0,
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: 10,
              padding: '8px 10px',
              maxWidth: '75%'
            }}>
              <div style={{ fontSize: 14 }}>{m.text}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #eee', background: '#fff' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px' }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        />
        <button onClick={handleSend} disabled={!draft.trim() || sending} style={{ background: '#ff7a00', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer' }}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
