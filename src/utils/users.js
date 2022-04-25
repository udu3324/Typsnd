const users = [];
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const { blacklistedUsernames, adminIPs, multipleRooms } = require("../config.js");

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const { encode } = require("html-entities");
const adminIcon = "<i class=\"fa-solid fa-shield\"></i> "

const addUser = ({ ip, id, username, room }) => {

  // Clean the data
  try {
    username = username.trim();
    room = room.trim();
  } catch (e) {
    console.log(e.name + ": " + e.message)
  }

  // Validate the data
  if (!username) {
    return {
      error: "Username is required!"
    };
  }

  // Check if user is over 19 charactars long
  if (username.length > 19) {
    return {
      error: "Nice try, but your username is over 19 charactars!"
    };
  }

  // Check for existing user
  const existingUser = users.find(user => {
    return user.room === room && user.username.replace(`${adminIcon}`, "") === username;
  });

  // Validate username
  if (existingUser) {
    return {
      error: "Username is in use!"
    };
  }

  // Make sure user is not impersonating
  if ((username.toLowerCase() === "admin")) {
    return {
      error: "Nice try, but impersonating is not allowed!"
    };
  }

  // Validate only chatroom is chat
  if (!(room === "Typsnd") && !multipleRooms) {
    return {
      error: "Nice try, but there is only one chat!"
    };
  }

  // Make sure username is not blacklisted
  if (blacklistedUsernames.map(v => v.toLowerCase()).some(v => username.toLowerCase().includes(v)) && !adminIPs.some(v => ip.includes(v))) {
    return {
      error: "Hey! That is a blacklisted username."
    };
  }

  // Remove XSS
  username = DOMPurify.sanitize(username);
  if ((username === "")) {
    return {
      error: "Nice try, but XSS does not work here!"
    };
  }

  // encode entities
  username = encode(username);

  // Add admin icon
  if (adminIPs.some(v => ip.includes(v))) {
    username = adminIcon + username
  }

  // Store id, user, and room
  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = id => {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = id => {
  return users.find(user => user.id === id);
};

const getUsersInRoom = room => {
  room = room.trim();
  return users.filter(user => user.room === room);
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  users
};
