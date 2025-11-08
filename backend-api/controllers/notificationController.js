const User = require('../models/userModel');
const { sendPushNotification } = require('../utils/pushService');

const resolveUserDocument = async (req) => {
  const candidates = [];
  if (req.user?._id) {
    candidates.push({ type: 'id', value: req.user._id });
  }
  if (req.user?.supabaseId) {
    candidates.push({ type: 'supabaseId', value: req.user.supabaseId });
  }
  if (req.supabaseUser?.id) {
    candidates.push({ type: 'supabaseId', value: req.supabaseUser.id });
  }
  if (req.user?.email) {
    candidates.push({ type: 'email', value: req.user.email });
  }
  if (req.supabaseUser?.email) {
    candidates.push({ type: 'email', value: req.supabaseUser.email });
  }

  for (const candidate of candidates) {
    if (!candidate.value) continue;
    let userDoc = null;
    if (candidate.type === 'id') {
      userDoc = await User.findById(candidate.value);
    } else if (candidate.type === 'supabaseId') {
      userDoc = await User.findOne({ supabaseId: candidate.value });
    } else if (candidate.type === 'email') {
      userDoc = await User.findOne({ email: candidate.value.toLowerCase() });
    }
    if (userDoc) return userDoc;
  }

  return null;
};

const pruneInvalidTokens = async (userDoc, invalidTokens = []) => {
  if (!userDoc || !Array.isArray(userDoc.pushTokens) || !invalidTokens.length) return;
  const invalidSet = new Set(invalidTokens.filter(Boolean));
  if (!invalidSet.size) return;
  userDoc.pushTokens = userDoc.pushTokens.filter((entry) => !invalidSet.has(entry.token));
  await userDoc.save();
};

const registerDeviceToken = async (req, res) => {
  try {
    const { token, platform = 'unknown' } = req.body || {};
    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const userDoc = await resolveUserDocument(req);
    if (!userDoc) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated user' });
    }

    userDoc.pushTokens = Array.isArray(userDoc.pushTokens) ? userDoc.pushTokens : [];
    const cleanedToken = token.trim();
    const filtered = userDoc.pushTokens.filter((entry) => entry.token !== cleanedToken);

    const newEntry = {
      token: cleanedToken,
      platform: typeof platform === 'string' ? platform.toLowerCase() : 'unknown',
      lastRegisteredAt: new Date(),
    };

    const merged = [newEntry, ...filtered];
    // Limit stored tokens to avoid unbounded growth
    userDoc.pushTokens = merged.slice(0, 12);
    await userDoc.save();

    return res.status(200).json({ success: true, message: 'Push token registered' });
  } catch (err) {
    console.error('[Notifications] register token error:', err);
    return res.status(500).json({ success: false, message: 'Failed to register push token' });
  }
};

const sendTestNotification = async (req, res) => {
  try {
    const userDoc = await resolveUserDocument(req);
    if (!userDoc) {
      return res.status(401).json({ success: false, message: 'Unable to resolve authenticated user' });
    }

    const tokens = (userDoc.pushTokens || []).map((entry) => entry.token).filter(Boolean);
    if (!tokens.length) {
      return res.status(200).json({ success: true, message: 'No registered device tokens for this user' });
    }

    const notification = {
      title: 'BuFood Notification Test',
      body: 'This is a sample push notification from BuFood.',
    };

    let result;
    try {
      result = await sendPushNotification({ tokens, notification, data: { kind: 'test' } });
    } catch (pushErr) {
      console.error('[Notifications] push send error:', pushErr);
      return res.status(500).json({ success: false, message: pushErr.message || 'Failed to send notification' });
    }

    const invalidTokens = [];
    if (result?.responses?.length) {
      result.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code || '';
          if (code.includes('registration-token-not-registered') || code.includes('invalid-registration-token')) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });
    }
    if (invalidTokens.length) {
      await pruneInvalidTokens(userDoc, invalidTokens);
    }

    return res.status(200).json({
      success: true,
      message: 'Test notification dispatched',
      result: {
        successCount: result?.successCount || 0,
        failureCount: result?.failureCount || 0,
      },
    });
  } catch (err) {
    console.error('[Notifications] test notification error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send test notification' });
  }
};

module.exports = {
  registerDeviceToken,
  sendTestNotification,
};
