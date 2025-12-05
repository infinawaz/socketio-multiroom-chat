const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
require("dotenv").config();

// DB Utils
const { saveMessage, getRoomMessages } = require("./utils/db");

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", async ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

    // Load Chat History
    try {
      const messages = await getRoomMessages(user.room);
      messages.forEach(msg => {
        // Send stored messages to the user
        socket.emit("message", {
          username: msg.username,
          text: msg.text,
          time: msg.time
        });
      });
    } catch (err) {
      console.error("Error loading messages:", err);
    }

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", async (msg) => {
    const user = getCurrentUser(socket.id);

    // Save to DB
    const formattedMsg = formatMessage(user.username, msg);

    try {
      await saveMessage(user.room, formattedMsg.username, formattedMsg.text, formattedMsg.time);
    } catch (err) {
      console.error("Error saving message:", err);
    }

    io.to(user.room).emit("message", formattedMsg);
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
