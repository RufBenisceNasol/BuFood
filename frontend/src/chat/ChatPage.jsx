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
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const pollRef = useRef(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const headerTitle = (location.state && location.state.title) || title;
  const headerAvatar = (location.state && location.state.avatar) || null;

  const participantMap = useMemo(() => {
    const map = new Map();
    if (meta?.participants?.length) {
      meta.participants.forEach((p) => {
        if (!p?.id) return;
        map.set(String(p.id), p);
      });
    }
    return map;
  }, [meta]);

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
    const hasAttachments = attachments.length > 0;
    if (!text && !hasAttachments) return;
    setSending(true);
    try {
      const body = {};
      if (text) body.text = text;
      if (hasAttachments) body.attachments = attachments;
      if (hasAttachments && !text) body.type = 'image';
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
      if (hasAttachments) setAttachments([]);
      setTimeout(scrollToBottom, 0);
    } catch (_) {
      // optionally show toast
    } finally {
      setSending(false);
    }
  };

  const triggerAttachmentPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAttachmentChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await chat.uploadImage(formData);
      const uploaded = res.data?.data || res.data;
      if (uploaded?.url) {
        setAttachments((prev) => [...prev, { url: uploaded.url, type: 'image' }]);
      }
    } catch (_) {
      // optionally surface error toast
    } finally {
      setUploadingAttachment(false);
      event.target.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f6f6f6', color: '#1f2937' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 1px', background: '#ff8c00', color: '#111827', position: 'sticky', top: 0, zIndex: 5, boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#000f2dff', fontWeight: 700, cursor: 'pointer', fontSize: 18 }}>&larr;</button>
        {(meta?.counterpart?.avatar || headerAvatar) ? (
          <img src={meta?.counterpart?.avatar || headerAvatar} alt={meta?.counterpart?.name || headerTitle || 'User'} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(59,130,246,0.25)' }} />
        ) : (
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'left', justifyContent: 'center', fontWeight: 700 }}>
            {(meta?.counterpart?.name || headerTitle || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{meta?.counterpart?.name || headerTitle}</div>
          {(meta?.customer || meta?.seller) && (
            <div style={{ fontSize: 12, color: '#22252aff' }}>
              {meta?.customer?.name && meta?.seller?.name
                ? `${meta.customer.name} • ${meta.seller.name}`
                : meta?.customer?.name || meta?.seller?.name}
            </div>
          )}
        </div>
      </div>

      {meta?.orderSummary?.items?.length > 0 && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(148,163,184,0.15)', background: '#ffffff' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#4b5563' }}>Ordered Items</div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: 10 }}>
            {meta.orderSummary.items.map((item) => (
              <div key={`${item.productId}-${item.optionName}`} style={{ minWidth: 96, border: '1px solid rgba(148,163,184,0.25)', borderRadius: 12, padding: 8, background: '#f8fafc' }}>
                <div style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', background: '#e2e8f0', marginBottom: 6 }}>
                  {item.image ? (
                    <img src={item.image} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12 }}>No Image</div>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#1f2937' }}>{item.productName}</div>
                {(item.variantName || item.optionName) && (
                  <div style={{ fontSize: 11, color: '#475569' }}>{[item.variantName, item.optionName].filter(Boolean).join(' • ')}</div>
                )}
                <div style={{ fontSize: 11, marginTop: 4, color: '#475569' }}>Qty: {item.quantity}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <div style={{ color: '#6b7280', padding: '8px 0' }}>Loading messages...</div>}
        {!loading && messages.map((m, idx) => {
          const senderIdStr = String(m.senderId || '');
          const mine = meta?.self?.id && senderIdStr === String(meta.self.id);
          const senderInfo = participantMap.get(senderIdStr) || (mine ? meta?.self : meta?.counterpart);
          const bubbleBg = mine ? '#4f8ef7' : '#e5e5ea';
          const bubbleColor = mine ? '#ffffff' : '#000000';
          const attachmentsList = Array.isArray(m.attachments) ? m.attachments : [];
          const showUnreadDivider = m.type === 'system-divider-unread';
          if (showUnreadDivider) {
            return (
              <div key={`divider-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 12 }}>
                <span style={{ flex: 1, height: 1, background: '#d1d5db' }} />
                <span>Unread messages</span>
                <span style={{ flex: 1, height: 1, background: '#d1d5db' }} />
              </div>
            );
          }
          return (
            <div
              key={m._id || m.createdAt || Math.random()}
              style={{
                display: 'flex',
                justifyContent: mine ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: 10
              }}
            >
              {!mine && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: '#e5e5ea' }}>
                  {senderInfo?.avatar ? (
                    <img src={senderInfo.avatar} alt={senderInfo?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontWeight: 700 }}>
                      {(senderInfo?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )}
              <div
                style={{
                  background: attachmentsList.length ? 'transparent' : bubbleBg,
                  color: attachmentsList.length ? '#111827' : bubbleColor,
                  borderRadius: mine ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                  padding: attachmentsList.length ? 0 : '10px 14px',
                  maxWidth: '75%',
                  boxShadow: attachmentsList.length ? 'none' : '0 6px 14px rgba(15, 23, 42, 0.12)',
                  border: attachmentsList.length ? 'none' : `1px solid ${mine ? 'rgba(37, 99, 235, 0.35)' : 'rgba(229, 231, 235, 1)'}`,
                  overflow: 'hidden'
                }}
              >
                {attachmentsList.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: mine ? '#4f8ef7' : '#f8fafc', padding: 10, borderRadius: mine ? '20px 20px 6px 20px' : '20px 20px 20px 6px' }}>
                    {attachmentsList.map((att, idx) => (
                      <div key={`${att.url || idx}`} style={{ borderRadius: 12, overflow: 'hidden', background: '#e2e8f0' }}>
                        <img src={att.url} alt="Attachment" style={{ width: '100%', maxWidth: 220, display: 'block', objectFit: 'cover' }} />
                      </div>
                    ))}
                    {m.text && (
                      <div style={{ fontSize: 14, color: mine ? '#ffffff' : '#0f172a' }}>{m.text}</div>
                    )}
                    <div style={{ fontSize: 11, color: mine ? 'rgba(255,255,255,0.7)' : '#6b7280', textAlign: 'right' }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                )}
                {!attachmentsList.length && (
                  <>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
                    <div style={{ fontSize: 11, color: mine ? 'rgba(255,255,255,0.7)' : '#6b7280', marginTop: 4, textAlign: 'right' }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </>
                )}
              </div>
              {mine && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: '#cbd5f5' }}>
                  {meta?.self?.avatar ? (
                    <img src={meta.self.avatar} alt={meta?.self?.name || 'You'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8', fontWeight: 700 }}>
                      {(meta?.self?.name || 'You').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(148,163,184,0.15)', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {attachments.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {attachments.map((att, idx) => (
              <div key={`${att.url}-${idx}`} style={{ width: 68, height: 68, borderRadius: 12, overflow: 'hidden', position: 'relative', border: '1px solid rgba(148,163,184,0.25)' }}>
                <img src={att.url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(15,23,42,0.75)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={triggerAttachmentPicker}
            disabled={uploadingAttachment}
            style={{
              background: '#e5e7eb',
              color: '#1f2937',
              border: 'none',
              padding: '2px 2px',
              borderRadius: 10,
              fontWeight: 400,
              cursor: uploadingAttachment ? 'not-allowed' : 'pointer',
              opacity: uploadingAttachment ? 0.6 : 1
            }}
          >
            {uploadingAttachment ? 'Uploading…' : 'Add Image'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAttachmentChange} style={{ display: 'none' }} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message..."
            style={{ flex: 1, border: '1px solid rgba(148,163,184,0.4)', background: '#f9fafb', color: '#111827', borderRadius: 999, padding: '12px 16px', fontSize: 14 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={(!draft.trim() && attachments.length === 0) || sending}
            style={{
              background: '#1d4ed8',
              color: '#ffffff',
              border: 'none',
              padding: '11px 20px',
              borderRadius: 999,
              fontWeight: 700,
              cursor: sending ? 'not-allowed' : 'pointer',
              opacity: ((!draft.trim() && attachments.length === 0) || sending) ? 0.5 : 1,
              transition: 'transform 0.15s ease'
            }}
          >
            Send
          </button>
        </div>
        <input
          type="text"
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default ChatPage;
