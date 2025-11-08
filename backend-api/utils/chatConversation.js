const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

function buildParticipantsKey(a, b) {
  const [x, y] = [String(a), String(b)].sort();
  return `${x}_${y}`;
}

function normalizeObjectId(value) {
  if (!value) {
    throw new Error('normalizeObjectId expected a value');
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  if (value._id) {
    return normalizeObjectId(value._id);
  }

  const strValue = String(value);
  if (mongoose.Types.ObjectId.isValid(strValue)) {
    return new mongoose.Types.ObjectId(strValue);
  }

  throw new Error(`Invalid ObjectId value: ${value}`);
}

async function getOrCreatePairConversation(userAId, userBId, session) {
  const objectIdA = normalizeObjectId(userAId);
  const objectIdB = normalizeObjectId(userBId);
  const [a, b] = [String(objectIdA), String(objectIdB)].sort();
  const key = `${a}_${b}`;
  const legacyKey = `${a}|${b}`;

  let query = Conversation.findOne({ participantsKey: { $in: [key, legacyKey] } }).sort({ updatedAt: -1 });
  if (session) query = query.session(session);
  let conversation = await query;

  if (!conversation) {
    const payload = {
      participants: [objectIdA, objectIdB],
      participantsKey: key,
      unreadCounts: {},
      createdBy: 'system'
    };
    if (session) {
      const created = await Conversation.create([payload], { session });
      conversation = Array.isArray(created) ? created[0] : created;
    } else {
      conversation = await Conversation.create(payload);
    }
    return { conversation, participantsKey: key };
  }

  let needsSave = false;
  if (conversation.participantsKey !== key) {
    conversation.participantsKey = key;
    needsSave = true;
  }

  const participantIds = new Set((conversation.participants || []).map((p) => String(p)));
  if (!participantIds.has(a) || !participantIds.has(b) || (conversation.participants || []).length !== 2) {
    conversation.participants = [objectIdA, objectIdB];
    needsSave = true;
  }

  if (needsSave) {
    if (session) {
      await conversation.save({ session });
    } else {
      await conversation.save();
    }
  }

  return { conversation, participantsKey: key };
}

module.exports = {
  buildParticipantsKey,
  normalizeObjectId,
  getOrCreatePairConversation,
};
