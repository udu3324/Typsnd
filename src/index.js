const path = require("path");
const http = require("http");
const express = require("express");
const ip = require('ip');
const { generateMessage, linkify } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom, users } = require("./utils/users");
const { serverPort, blacklistedIPs, msgGreet, adminIPs, tabs, adminIcon, altDetection, htmlTitle, blacklistedUsernames } = require("./config.js");
const { encode } = require("html-entities");
var { msgCooldown } = require("./config.js");

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const { cLog, Color, time } = require("./utils/logging");

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  maxHttpBufferSize: 25e8 //25mb
});

const port = serverPort;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));


// array of ips used to detect alts
var ipArray = [];

// array of ips and usernames to ban and unban people
var ipUsernameArray = [];

// array of ips and usernames that are banned
var banArray = [];

io.on("connection", socket => {
  let ip = getIP(socket);

  var isAlt = ipArray.some(v => ip.includes(v));
  var isBlacklisted = blacklistedIPs.some(v => ip.includes(v));
  var isBanned = banArray.some(v => ip.includes(v));

  //filter connection
  if (isAlt && altDetection) {
    socket.emit("alt-kick")
    cLog(Color.bg.red, `${time()} CONNECTION × IP.ALT: ${ip}`)
    return;
  }

  if (isBlacklisted) {
    socket.emit("blacklisted-ip-kick")
    cLog(Color.bg.red, `${time()} CONNECTION × IP.BLACKLISTED: ${ip}`)
    return;
  }

  if (isBanned) {
    socket.emit("ban", "authenticatedFromSocketServer")
    cLog(Color.bg.red, `${time()} CONNECTION × IP.BANNED: ${ip}`)
    return;
  }

  //allow them to connect
  sockets(socket);

  if (isAlt && !altDetection)
    cLog(Color.bg.green, `${time()} CONNECTION ✓ IP.ALT: ${ip}`);
  else
    cLog(Color.bg.green, `${time()} CONNECTION ✓ IP: ${ip}`);
});

function sockets(socket) {
  //get ip and if they're an admin
  const ip = getIP(socket);
  const admin = adminIPs.some(v => ip.includes(v));
   

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ ip, id: socket.id, ...options });
    if (error) {
      return callback(error);
    } else {
      socket.join(user.room);
      cLog(Color.bg.green, `${time()} JOIN -> USER: ${getUsername(user)} | ROOM: ${user.room} | IP: ${getIP(socket)}`);

      //join and welcome message
      socket.emit("message", generateMessage(`${adminIcon}Admin`, `Welcome, ${user.username}! ${msgGreet}`));
      socket.broadcast.to(user.room).emit("message", generateMessage(`${adminIcon}Admin`, `<i class="fa-solid fa-user-check fa-lg"></i> ${user.username} has joined!`));

      //send new room data
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });

      //add ip to arrays
      ipArray.push(ip);

      ipUsernameArray.push(user.username)
      ipUsernameArray.push(ip)

      //send user if they're an admin and what the admin icon is
      var adminArr = [adminIPs.some(v => ip.includes(v)), adminIcon]
      socket.emit("admin-status", adminArr)

      socket.emit("starting-data", [tabs, msgCooldown, htmlTitle])

      callback();
    }
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    var msg = message;

    // removes unsafe tags and attributes from html
    if (!admin) {
      msg = DOMPurify.sanitize(msg);
      if (msg === "") {
        cLog(Color.bg.red, `${time()} Message from ${getUsername(user)} has been blocked due to XSS.`);
        msg = `Hi, I'm ${getUsername(user)} and just tried to do XSS.`;
      }
  
      // convert &, <, >, ", ' into entities
      msg = encode(msg).replace("&amp;lt;", "&lt;").replace("&amp;gt;", "&gt;");
    }

    // check if msg is over 3000 characters
    if (msg.length > 3000) {
      cLog(Color.bg.red, `${time()} Message from ${getUsername(user)} has been blocked due to character limit.`);
      msg = `Hi, I'm ${getUsername(user)} and just tried to go over the 3000 character limit.`;
    }

    // creates href clickable links for links in the msg
    msg = linkify(msg)

    socket.emit("message-cooldown", msgCooldown);
    io.to(user.room).emit("message", generateMessage(user.username, msg));

    cLog(Color.bright, `${time()} MESSAGE > USER: ${getUsername(user)} | ROOM: ${user.room} | IP: ${getIP(socket)}`);
    callback();
  });

  socket.on("sendImage", (base64, callback) => {
    const user = getUser(socket.id);

    var element = "<img id=\"uploaded-image\" alt=\"image\" src=\"" + base64 + "\">";

    socket.emit("message-cooldown", msgCooldown);
    io.to(user.room).emit("image", generateMessage(user.username, element));

    cLog(Color.bright, `${time()} IMAGE > User: ${getUsername(user)} | ROOM: ${user.room} | IP: ${getIP(socket)}`);
    callback();
  });

  socket.on("sendDirectMessage", (packet, callback) => {
    const userSentFrom = getUser(socket.id);
    const userSendTo = packet[0];
    const userMessage = packet[1];

    //check if user sending to is real
    var userExists = false;
    var userID;

    for (let index = 0; index < users.length; ++index) {
      //remove shield
      if (users[index].username.replace(adminIcon, "") === userSendTo) {
        userID = users[index].id;
        userExists = true
      }
    }

    //check if message is over 280
    if (userMessage.length > 280) {
      cLog(Color.bg.red, `${time()} IP: ${ip} has tried to bypass the 280 character limit!`)
      return callback("Message is over 280!");
    }

    if (!userExists) {
      return callback("User does not exist!");
    } else {

      //send to that user
      var userSendingTo = getUser(userID)

      var packetOut = [userSentFrom.username, linkify(userMessage)]
      io.to(userSendingTo.room).emit("recieveDirectMessage" + userSendTo, packetOut);

      cLog(Color.bright, `${time()} DM > FROM: ${getUsername(userSentFrom)} | TO: ${userSendTo}`)
      callback();
    }
  });

  socket.on("setCooldown", (seconds) => {
    if (!admin) {
      cLog(Color.bg.red, `${time()} IP: ${ip} has tried to set cooldown without having admin!`)
      return;
    }

    msgCooldown = seconds;
    socket.emit("message-cooldown", msgCooldown);

    cLog(Color.bright, `${time()} New message cooldown is ${msgCooldown} second(s). (set by ip: ${ip})`)

    sendToAllRooms(io, "message", generateMessage(`${adminIcon}Admin`, `<i class="fa-solid fa-stopwatch fa-lg"></i> The message cooldown has been set to ${seconds} second(s).`))
  });

  socket.on("kickUser", (username, callback) => {
    if (!admin) {
      cLog(Color.bg.red, `${time()} !!!!! IP: ${ip} has tried to kick someone without having Admin !!!!!`)
      return callback("bad");
    }

    const userKicking = username;

    var userExists = false;
    var userModerationObject;
    // check if user sending to is real
    for (let index = 0; index < users.length; ++index) {
      //remove shield
      if (users[index].username.replace(adminIcon, "") === userKicking) {
        //check if its not a admin
        if (!(users[index].username.includes(adminIcon, ""))) {
          userExists = true
          userModerationObject = users[index]
        } else {
          return callback("isAdmin");
        }
      }
    }

    if (!userExists) {
      return callback("notExistingUser");
    }

    io.to(userModerationObject.room).emit("kick", username);

    cLog(Color.bright, `${time()} User: ${username} has been kicked. (kicked by ip: ${ip})`)
    sendToAllRooms(io, "message", generateMessage(`${adminIcon}Admin`, `<i class="fa-solid fa-xmark fa-lg"></i> ${username} has been kicked.`));
    callback("good");
  });

  socket.on("banUser", (username, callback) => {
    if (!admin) {
      cLog(Color.bg.red, `${time()} !!!!! IP: ${ip} has tried to ban someone without having Admin !!!!!`)
      return callback("bad");
    }

    const userKicking = username;

    var userExists = false;
    var userModerationObject;
    // check if user sending to is real
    for (let index = 0; index < users.length; ++index) {
      //remove shield
      if (users[index].username.replace(adminIcon, "") === userKicking) {
        //check if its not a admin
        if (!(users[index].username.includes(adminIcon, ""))) {
          userExists = true
          userModerationObject = users[index]
        } else {
          return callback("isAdmin");
        }
      }
    }

    if (!userExists) {
      return callback("notExistingUser");
    }

    //ban them
    io.to(userModerationObject.room).emit("ban", username);

    //ban their username from being used
    blacklistedUsernames.push(username)

    //find their ip
    var indexOfIP = ipUsernameArray.indexOf(username) + 1

    //add to array of ban
    banArray.push(username)
    banArray.push(ipUsernameArray[indexOfIP])

    cLog(Color.bright, `${time()} User: ${username} has been banned. (banned by ip: ${ip})`)
    sendToAllRooms(io, "message", generateMessage(`${adminIcon}Admin`, `<i class="fa-solid fa-gavel fa-lg"></i> ${username} has been banned.`));

    callback("good");
  });

  socket.on("unbanUser", (username, callback) => {
    if (!admin) {
      cLog(Color.bg.red, `${time()} !!!!! IP: ${ip} has tried to unban someone without having Admin !!!!!`)
      return callback("bad");
    }

    const userUnbanning = username;

    var userExists = false;
    // check if user sending to is real
    for (let index = 0; index < banArray.length; ++index) {
      if (banArray[index] === userUnbanning) {
        userExists = true
      }
    }

    if (!userExists) {
      //send a list of banned people if username entered is wrong
      var listOfBannedPeople = "User provided was invalid. See list below for unbannable people! \n\nList of Banned Users:\n"

      //write a list of banned people (not their ips) only if there are any
      if (banArray.length != 0) {

        for (let index = 0; index < banArray.length; index = index + 2) {
          listOfBannedPeople = listOfBannedPeople + banArray[index] + "\n"
        }

      } else {
        listOfBannedPeople = listOfBannedPeople + "none"
      }

      return callback(listOfBannedPeople);
    }

    //remove user from blacklisted usernames and ban array
    var index = banArray.indexOf(userUnbanning)
    if (index > -1) {
      banArray.splice(index + 1, 1); //remove ip
      banArray.splice(index, 1); //remove username
    }

    var index2 = blacklistedUsernames.indexOf(userUnbanning)
    if (index2 > -1) {
      blacklistedUsernames.splice(index2 + 1, 1); //remove ip
      blacklistedUsernames.splice(index2, 1); //remove username
    }

    cLog(Color.bright, `${time()} User: ${username} has been unbanned. (unbanned by ip: ${ip})`)
    sendToAllRooms(io, "message", generateMessage(`${adminIcon}Admin`, `<i class="fa-solid fa-gavel fa-lg"></i> ${username} has been unbanned.`));

    callback("good");
  });

  socket.on("alert", (message, callback) => {
    if (!admin) {
      cLog(Color.bg.red, `${time()} !!!!! IP: ${ip} has tried to alert everyone without having Admin !!!!!`)
      return callback("bad");
    }

    //filter msg length
    if (message.length < 3) {
      return callback("short");
    }

    if (message.length > 70) {
      return callback("long");
    }

    message = linkify(message)

    sendToAllRooms(io, "alert", message)
    cLog(Color.bright, `${time()} IP: ${ip} has sent a alert to everyone. ALERT = ${message}`)

    callback("good");
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      //remove ip from list when they leave
      ipArray = ipArray.filter(e => e !== getIP(socket));

      var index = ipUsernameArray.indexOf(getIP(socket))
      if (index > -1) {
        ipUsernameArray.splice(index, 1); //remove ip
        ipUsernameArray.splice(index - 1, 1); //remove username
      }

      cLog(Color.bg.blue, `${time()} LEFT -> User: ${getUsername(user)} | ROOM: ${user.room} | IP: ${getIP(socket)}`);

      io.to(user.room).emit("message", generateMessage(`${adminIcon}Admin`, `<i class="fa-solid fa-user-large-slash fa-lg"></i> ${user.username} has left!`));

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
}

function sendToAllRooms(io, type, string) {
  var roomsSentTo = [""]
  for (let index = 0; index < users.length; ++index) {
    if (!roomsSentTo.includes(users[index].room)) {
      io.to(users[index].room).emit(type, string);

      roomsSentTo.push(users[index].room)
    }
  }
}

function getIP(socket) {
  let ip = socket.handshake.address.substring(7);
  if (ip === "" || ip === "127.0.0.1") {
    ip = "localhost";
  }
  return ip;
}

function getUsername(user) {
  if (user.username === undefined) {
    return user.replace(`${adminIcon}`, "(admin) ");
  } else {
    return user.username.replace(`${adminIcon}`, "(admin) ");
  }
}

server.listen(port, () => { //credits n stuff
  process.stdout.write('\033c');

  console.log("\n Typsnd is running at: \n");
  cLog(Color.fg.cyan, `http://localhost:${port}`, ` - Local:   `)
  cLog(Color.fg.cyan, `http://${ip.address()}:${port}`, ` - Network: `)
  cLog(Color.fg.green, "http://github.com/udu3324 \n", "\n Have fun using Typsnd! Check out\n more of my projects on GitHub! \n ")
});
