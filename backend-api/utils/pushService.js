const admin = require('firebase-admin');
const User = require('../models/userModel');

let firebaseInitialized = false;

function ensureFirebase() {
  if (firebaseInitialized) {
    return admin;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not configured.');
  }

  let credentialConfig;
  try {
    credentialConfig = JSON.parse(serviceAccountJson);
  } catch (err) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.');
  }

  admin.initializeApp({
    credential: admin.credential.cert(credentialConfig),
  });

  firebaseInitialized = true;
  return admin;
}

async function sendPushNotification({ tokens, notification, data = {} }) {
  const uniqueTokens = Array.from(new Set((tokens || []).map((t) => String(t || '').trim()).filter(Boolean)));
  if (!uniqueTokens.length) {
    return { successCount: 0, failureCount: 0, skipped: true, message: 'No tokens provided' };
  }

  const sdk = ensureFirebase();
  const messaging = sdk.messaging();

  const payload = {
    tokens: uniqueTokens,
    notification,
    data,
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
    android: {
      notification: {
        sound: 'default',
        channelId: 'messages',
        priority: 'high',
      },
    },
  };

  return messaging.sendEachForMulticast(payload);
}

async function getUserPushTokens(userId) {
  if (!userId) return [];
  const userDoc = await User.findById(userId).select('pushTokens');
  if (!userDoc || !Array.isArray(userDoc.pushTokens)) return [];
  return userDoc.pushTokens
    .map((entry) => entry?.token)
    .filter(Boolean)
    .map((token) => String(token).trim())
    .filter(Boolean);
}

async function pruneInvalidUserTokens(userDoc, invalidTokens = []) {
  if (!userDoc || !Array.isArray(userDoc.pushTokens) || !invalidTokens.length) return;
  const invalidSet = new Set(invalidTokens.filter(Boolean));
  if (!invalidSet.size) return;
  const before = userDoc.pushTokens.length;
  userDoc.pushTokens = userDoc.pushTokens.filter((entry) => entry?.token && !invalidSet.has(entry.token));
  if (userDoc.pushTokens.length !== before) {
    await userDoc.save();
  }
}

async function sendPushToUser(userId, { notification, data = {} } = {}) {
  if (!userId || !notification) {
    return { successCount: 0, failureCount: 0, skipped: true };
  }

  const userDoc = await User.findById(userId).select('pushTokens');
  if (!userDoc || !Array.isArray(userDoc.pushTokens) || !userDoc.pushTokens.length) {
    return { successCount: 0, failureCount: 0, skipped: true };
  }

  const tokens = userDoc.pushTokens
    .map((entry) => entry?.token)
    .filter(Boolean)
    .map((token) => String(token).trim())
    .filter(Boolean);

  if (!tokens.length) {
    return { successCount: 0, failureCount: 0, skipped: true };
  }

  let result;
  try {
    result = await sendPushNotification({ tokens, notification, data });
  } catch (err) {
    console.error(`[Push] Failed to send notification to user ${userId}:`, err);
    return { successCount: 0, failureCount: tokens.length, error: err?.message || 'Push send failed' };
  }

  const invalidTokens = [];
  if (result?.responses?.length) {
    result.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code || '';
        if (
          code.includes('registration-token-not-registered') ||
          code.includes('invalid-registration-token') ||
          code.includes('messaging/invalid-argument')
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });
  }

  if (invalidTokens.length) {
    try {
      await pruneInvalidUserTokens(userDoc, invalidTokens);
    } catch (err) {
      console.error('[Push] Failed to prune invalid tokens:', err);
    }
  }

  return result;
}

module.exports = {
  sendPushNotification,
  getUserPushTokens,
  sendPushToUser,
};
