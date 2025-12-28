const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const SIZE = 100;
const COOLDOWN_MS = 5000;

let canvas = Array.from({ length: SIZE }, () =>
  Array.from({ length: SIZE }, () => "#ffffff")
);

let lastPlaceTime = {};

io.on("connection", (socket) => {
  const ip = socket.handshake.address;

  socket.emit("init", canvas);

  socket.on("placePixel", ({ x, y, color }) => {
    const now = Date.now();

    if (lastPlaceTime[ip] && now - lastPlaceTime[ip] < COOLDOWN_MS) {
      socket.emit("cooldown", {
        remaining: Math.ceil(
          (COOLDOWN_MS - (now - lastPlaceTime[ip])) / 1000
        )
      });
      return;
    }

    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      !/^#[0-9A-Fa-f]{6}$/.test(color) ||
      x < 0 || y < 0 ||
      x >= SIZE || y >= SIZE
    ) return;

    canvas[y][x] = color;
    lastPlaceTime[ip] = now;

    io.emit("pixelUpdate", { x, y, color });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
