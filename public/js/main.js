const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

// Join chatroom
// Join chatroom
socket.on('connect', () => {
  if (username && room) {
    socket.emit('joinRoom', { username, room });
  }
});

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on('message', (message) => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Get message text
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  }

  // Emit message to server
  socket.emit('chatMessage', msg);

  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');

  if (message.username === username) {
    div.classList.add('me');
  } else if (message.username === 'Raabta Bot') {
    div.classList.add('bot');
  } else {
    div.classList.add('other');
  }

  const p = document.createElement('p');
  p.classList.add('meta');
  p.innerHTML = `<span>${message.username}</span> <span>${message.time}</span>`;
  div.appendChild(p);

  const para = document.createElement('p');
  para.classList.add('text');
  para.innerText = message.text;
  div.appendChild(para);

  document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room || "Unknown Room (Check URL)";
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerHTML = `<i class="fas fa-user-circle"></i> ${user.username}`;
    userList.appendChild(li);
  });
}

// Prompt the user before leave chat room
// Note: In new chat.html this is an anchor tag, but we can intercept it if we want custom logic.
// The existing code looked for 'leave-btn' by ID, but in my new HTML I used 'chat-leave-btn' class.
// I'll grab it by selector.
const leaveBtn = document.querySelector('.chat-leave-btn');
if (leaveBtn) {
  leaveBtn.addEventListener('click', (e) => {
    const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
    if (!leaveRoom) {
      e.preventDefault();
    }
  });
}
