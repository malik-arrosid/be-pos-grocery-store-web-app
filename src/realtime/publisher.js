import { getClients } from "./sse/index.js";

export const publishNotification = (notification) => {
  const clients = getClients();

  if (clients.size === 0) {
    return;
  }

  const payload = JSON.stringify({
    event: "notification",
    data: notification,
  });

  for (const [, responses] of clients) {
    for (const response of responses) {
      try {
        response.write(`event: notification\n`);
        response.write(`data: ${payload}\n\n`);
      } catch (error) {
        console.error("Publish Notification Error:", error);
      }
    }
  }
};