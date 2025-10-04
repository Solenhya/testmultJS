const { Server } = require("socket.io");
const http = require("http");

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" }
});

const players = {};
const inputs = {};
const TICK_RATE = 60; // 30 fois par seconde


io.on("connection", (socket) => {
  console.log("Connexion :", socket.id);
  players[socket.id] = { x: 0, y: 0 };
  inputs[socket.id] = { up: false, down: false, left: false, right: false };

  socket.on("input", (data) => {
    inputs[socket.id] = data;
  });

  socket.on("disconnect", () => {
    console.log("Déconnexion :", socket.id);
    delete players[socket.id];
    delete inputs[socket.id];
    io.emit("state", players);
  });
});

// Boucle serveur fixe
setInterval(() => {
  //console.log("players:",players);
  //console.log("inputs:",inputs)
  for (const id in players) {

    const input = inputs[id];
    const player = players[id];
    const speed = 0.1;

    if (input.up) player.y += speed;
    if (input.down) player.y -= speed;
    if (input.left) player.x -= speed;
    if (input.right) player.x += speed;
  }
  io.emit("state", players); // réplication
}, 1000 / TICK_RATE);

server.listen(3000, () => {
  console.log("Serveur en ligne sur http://localhost:3000");
});