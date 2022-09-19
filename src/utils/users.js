const users = [];
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const { blacklistedUsernames, adminIPs, multipleRooms, adminIcon, blacklistSpecialCharactarsInUsername } = require("../config.js");

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const { encode } = require("html-entities");

const addUser = ({ ip, id, username, room }) => {
  var isAdmin = adminIPs.some(v => ip.includes(v));

  // Clean the data
  try {
    username = username.trim();
    room = room.trim();
  } catch (e) {
    console.log(e.name + ": " + e.message)
  }

  var lcUsr = username.toLowerCase();

  // Validate the data
  if (!username) {
    return {
      error: "Username is required!"
    };
  }

  // Check if user is over 19 characters long
  if (username.length > 19) {
    return {
      error: "Nice try, but your username is over 19 characters!"
    };
  }

  // Blacklist space in username
  if (username.includes(" ")) {
    return {
      error: "Spaces aren't allowed in usernames!"
    };
  }

  // Blacklist special symbols in usernames
  if (!/^[A-Za-z0-9!@#$%^&*()\[\]{};':",.<>\/\\|=`~?+_-]*$/.test(username) && blacklistSpecialCharactarsInUsername) {
    return {
      error: "Special charactars aren't allowed in usernames! Only A-Z 0-9 !@#$%^&*()[]{};':\",.<>/\\|=`~?+_- is allowed."
    };
  }

  // Check for existing user
  for (let index = 0; index < users.length; ++index) {

    //remove shield and check all users in rooms
    if (users[index].username.replace(adminIcon, "").toLowerCase() === lcUsr) {
      return {
        error: "Username is in use!"
      };
    }
  }

  // Validate only chatroom is chat if multiple rooms is disabled
  if (!(room === "Typsnd") && !multipleRooms) {
    return {
      error: "Multiple rooms are currently disabled."
    };
  }

  // Make sure username is not blacklisted (allow admins to use blacklisted usernames anyways)
  if (!isAdmin && blacklistedUsernames.map(v => v.toLowerCase()).some(v => username.toLowerCase().includes(v))) {
    return {
      error: "Hey! That's a blacklisted username!"
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
