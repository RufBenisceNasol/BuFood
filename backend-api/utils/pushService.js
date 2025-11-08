const admin = require('firebase-admin');

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
  if (!tokens || !tokens.length) {
    return { success: 0, failure: 0, message: 'No tokens provided' };
  }

  const sdk = ensureFirebase();
  const messaging = sdk.messaging();

  const payload = {
    tokens,
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

module.exports = {
  sendPushNotification,
};
