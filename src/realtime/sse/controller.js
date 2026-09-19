import { addClient, removeClient } from "./manager.js";

export const notificationStream = (req, res) => {
  const userId = req.user.id_user;
  console.log(`User ${userId} connected to SSE`);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders();

  addClient(userId, res);

  res.write("event: connected\n");
  res.write(
    `data: ${JSON.stringify({
      success: true,
      message: "SSE Connected",
    })}\n\n`,
  );

  req.on("close", () => {
    removeClient(userId, res);
    res.end();
  });
};