import { getMessaging } from "firebase-admin/messaging";
import firebaseApp from "../config/firebase.js";
import config from "../config/config.js";
import { getFcmTokensByRole, deleteFcmTokensByValue } from "./fcm.repository.js";

const messaging = getMessaging(firebaseApp);

const MULTICAST_BATCH_SIZE = 500; // FCM hard limit for sendEachForMulticast

const PRUNABLE_ERROR_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export const sendPushToTokens = async ({ tokens, title, body, data = {} }) => {
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, prunedCount: 0 };
  }

  const stringData = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value ?? "")]),
  );
  const webNotificationData = {
    ...stringData,
    notification_title: String(title ?? ""),
    notification_body: String(body ?? ""),
  };

  let successCount = 0;
  let failureCount = 0;
  const invalidTokens = [];

  for (const batch of chunk(tokens, MULTICAST_BATCH_SIZE)) {
    try {
      const message = {
        tokens: batch,
        data: webNotificationData,
        android: {
          priority: "high",
          notification: {
            channelId: config.app.fcmAndroidChannelId,
            priority: "max",
            sound: "default",
            visibility: "public",
          },
        },
        webpush: {
          headers: { Urgency: "high" },
        },
      };

      const response = await messaging.sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((result, index) => {
        if (
          !result.success &&
          result.error &&
          PRUNABLE_ERROR_CODES.has(result.error.code)
        ) {
          invalidTokens.push(batch[index]);
        }
      });
    } catch (error) {
      console.error("FCM sendEachForMulticast batch error:", error);
      failureCount += batch.length;
    }
  }

  let prunedCount = 0;
  if (invalidTokens.length > 0) {
    try {
      prunedCount = await deleteFcmTokensByValue(invalidTokens);
    } catch (error) {
      console.error("Error pruning invalid FCM tokens:", error);
    }
  }

  return { successCount, failureCount, prunedCount };
};

export const sendPushToRole = async ({ role, title, body, data }) => {
  const rows = await getFcmTokensByRole(role);
  const tokens = rows.map((row) => row.fcm_token);

  return sendPushToTokens({ tokens, title, body, data });
};

export const sendOwnerPush = async (notification) => {
  return sendPushToRole({
    role: "owner",
    title: notification.title,
    body: notification.message,
    data: {
      type: notification.notification_type,
      id_notification: notification.id_notification,
      reference_table: notification.reference_table || "",
      reference_id: notification.reference_id || "",
    },
  });
};