const path = require("path");
const http = require("http");
const express = require("express");
const URI = require("urijs");
const ip = require('ip');
const { generateMessage } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom, users } = require("./utils/users");
const { serverPort, blacklistedIPs, msgGreet, adminIPs, tabs, adminIcon, altDetection, htmlTitle, blacklistedUsernames } = require("./config.js");
const { encode } = require("html-entities");
var { msgCooldown } = require("./config.js");

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

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

function sendToAllRooms(io, type, string) {
  var roomsSentTo = [""]
  for (let index = 0; index < users.length; ++index) {
    if (!roomsSentTo.includes(users[index].room)) {
      io.to(users[index].room).emit(type, string);

      roomsSentTo.push(users[index].room)
    }
  }
}

io.on("connection", socket => {
  let ip = getIP(socket);

  var isAlt = ipArray.some(v => ip.includes(v));
  var isBlacklisted = blacklistedIPs.some(v => ip.includes(v));
  var isBanned = banArray.some(v => ip.includes(v));

  if (isAlt && altDetection) {
    socket.emit("alt-kick")
    console.log("CONNECTION < IP.ALT: " + ip);
  } else if (isBlacklisted) {
    socket.emit("blacklisted-ip-kick")
    console.log("CONNECTION < IP.BLACKLISTED: " + ip);
  } else if (isBanned) {
    socket.emit("ban", "authenticatedFromSocketServer")
    console.log("CONNECTION < IP.BANNED: " + ip);
  } else {

    // allow them to connect
    if (isAlt && !altDetection) {
      console.log("CONNECTION > IP.ALT: " + ip);
    } else {
      console.log("CONNECTION > IP: " + ip);
    }

    sockets(socket);
  }
});

function sockets(socket) {
  let ip = getIP(socket);

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ ip, id: socket.id, ...options });
    if (error) {
      return callback(error);
    } else {
      socket.join(user.room);
      console.log(`JOIN -> User: ${getUsername(user)} | ROOM: ${user.room} | IP: ${getIP(socket)}`);

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

      //set cooldown
      socket.emit("message-cooldown", msgCooldown);

      //send user if they're an admin and what the admin icon is
      var adminArr = [adminIPs.some(v => ip.includes(v)), adminIcon]
      socket.emit("admin-status", adminArr)

      //send the user tabs
      socket.emit("tabs", tabs);

      //send the user the name of the html file
      socket.emit("html-title", htmlTitle);

      callback();
    }
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    // removes unsafe tags and attributes from html
    var msg = DOMPurify.sanitize(message);
    if (msg === "") {
      console.log(`Message from ${getUsername(user)} has been blocked due to XSS.`);
      msg = `Hi, I'm ${getUsername(user)} and just tried to do XSS.`;
    }

    // check if msg is over 3000 characters
    if (msg.length > 3000) {
      console.log(`Message from ${getUsername(user)} has been blocked due to character limit.`);
      msg = `Hi, I'm ${getUsername(user)} and just tried to go over the 3000 character limit.`;
    }

    // convert &, <, >, ", ' into entities
    msg = encode(msg);

    //fix < and >
    msg = msg.replace("&amp;lt;", "&lt;").replace("&amp;gt;", "&gt;")

    // creates href clickable links for links in the msg
    msg = URI.withinString(msg, function (url) {
      return "<a href=\"" + url + "\" target=\"_blank\">" + url + "</a>";
    });

    socket.emit("message-cooldown", msgCooldown);
    io.to(user.room).emit("message", generateMessage(user.username, msg));

    console.log(`MESSAGE -> USER: ${getUsername(user)} | ROOM: ${user.room} | IP: ${getIP(socket)}`);
    callback();
  });

  socket.on("sendImage", (base64, callback) => {
    const user = getUser(socket.id);

    var element = "<img id=\"uploaded-image\" alt=\"image\" src=\"" + base64 + "\">";

    socket.emit("message-cooldown", msgCooldown);
    io.to(user.room).emit("image", generateMessage(user.username, element));

    console.log(`IMAGE -> User: ${getUsername(user)} | ROOM: ${user.room} | IP: ${getIP(socket)}`);
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
      console.log("IP: " + ip + " has tried to bypass the 280 character limit!")
      callback("Message is over 280!");
      return;
    }

    if (!userExists) {
      callback("User does not exist!");
    } else {

      //send to that user
      var userSendingTo = getUser(userID)

      var packetOut = [userSentFrom.username, userMessage]
      io.to(userSendingTo.room).emit("recieveDirectMessage" + userSendTo, packetOut);

      console.log("DM -> FROM: " + getUsername(userSentFrom) + " | TO: " + userSendTo)
      callback();
    }
  });

  socket.on("setCooldown", (seconds) => {
    const user = getUser(socket.id);
    // check if user is actually a admin

    if (adminIPs.some(v => ip.includes(v))) {
      msgCooldown = seconds;
      socket.emit("message-cooldown", msgCooldown);

      console.log("New message cooldown is " + msgCooldown + " seconds. (set by ip: " + ip + ")")
      io.to(user.room).emit("message", generateMessage(`${adminIcon}Admin`, `<i class="fa-solid fa-stopwatch fa-lg"></i> The message cooldown has been set to ${seconds} second(s).`));
    } else {
      console.log("IP: " + ip + " has tried to set cooldown without having admin!")
    }
  });

  socket.on("kickUser", (username, callback) => {
    const user = getUser(socket.id);
    const userKicking = username;

    var isAdmin = false;
    var userExists = false;

    // check if user is actually a admin
    if (adminIPs.some(v => ip.includes(v))) {
      isAdmin = true
    }

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
          callback("isAdmin");
        }
      }
    }

    if (userExists && isAdmin) {
      io.to(userModerationObject.room).emit("kick", username);

      console.log("User: " + username + " has been kicked. (kicked by ip: " + ip + ")")
      io.to(user.room).emit("message", generateMessage(`${adminIcon}Admin`, `<i class="fa-solid fa-xmark fa-lg"></i> ${username} has been kicked.`));
      callback("good");
    } else if (!userExists && isAdmin) {
      callback("notExistingUser");
    } else {
      console.log("!!!!! IP: " + ip + " has tried to kick someone without having Admin !!!!!")
      callback("bad");
    }
  });

  socket.on("banUser", (username, callback) => {
    const user = getUser(socket.id);
    const userKicking = username;

    var isAdmin = false;
    var userExists = false;

    // check if user is actually a admin
    if (adminIPs.some(v => ip.includes(v))) {
      isAdmin = true
    }

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
          callback("isAdmin");
        }
      }
    }

    if (userExists && isAdmin) {
      //ban them
      io.to(userModerationObject.room).emit("ban", username);

      //ban their username from being used
      blacklistedUsernames.push(username)

      //find their ip
      var indexOfIP = ipUsernameArray.indexOf(username) + 1

      //add to array of ban
      banArray.push(username)
      banArray.push(ipUsernameArray[indexOfIP])

      console.log("User: " + username + " has been banned. (banned by ip: " + ip + ")")
      io.to(user.room).emit("message", generateMessage(`${adminIcon}Admin`, `<i class="fa-solid fa-gavel fa-lg"></i> ${username} has been banned.`));
      callback("good");
    } else if (!userExists && isAdmin) {
      callback("notExistingUser");
    } else {
      console.log("!!!!! IP: " + ip + " has tried to ban someone without having Admin !!!!!")
      callback("bad");
    }
  });

  socket.on("unbanUser", (username, callback) => {
    const user = getUser(socket.id);
    const userUnbanning = username;

    var isAdmin = false;
    var userExists = false;

    // check if user is actually a admin
    if (adminIPs.some(v => ip.includes(v))) {
      isAdmin = true
    }

    // check if user sending to is real
    for (let index = 0; index < banArray.length; ++index) {
      //remove shield
      if (banArray[index] === userUnbanning) {
        userExists = true
      }
    }

    if (userExists && isAdmin) {

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

      console.log("User: " + username + " has been unbanned. (unbanned by ip: " + ip + ")")
      io.to(user.room).emit("message", generateMessage(`${adminIcon}Admin`, `<i class="fa-solid fa-gavel fa-lg"></i> ${username} has been unbanned.`));
      callback("good");
    } else if (!userExists && isAdmin) {
      //send a list of banned people if username entered is wrong
      var listOfBannedPeople = "User provided was invalid. See list below for unbannable people! \n\n"

      listOfBannedPeople = listOfBannedPeople + "List of Banned Users: \n"

      //write a list of banned people (not their ips) only if there are any
      if (banArray.length != 0) {

        for (let index = 0; index < banArray.length; index = index + 2) {
          listOfBannedPeople = listOfBannedPeople + banArray[index] + "\n"
        }

      } else {
        listOfBannedPeople = listOfBannedPeople + "none"
      }

      callback(listOfBannedPeople);
    } else {
      console.log("!!!!! IP: " + ip + " has tried to unban someone without having Admin !!!!!")
      callback("bad");
    }
  });

  socket.on("alert", (message, callback) => {
    const user = getUser(socket.id);

    // check if user is actually a admin
    if (adminIPs.some(v => ip.includes(v))) {
      if (message.length < 3) {
        callback("short");
      } else if (message.length > 70) {
        callback("long");
      } else {
        sendToAllRooms(io, "alert", message)

        callback("good");
      }
    } else {
      console.log("!!!!! IP: " + ip + " has tried to alert everyone without having Admin !!!!!")
      callback("bad");
    }
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    //remove ip from list when they leave
    ipArray = ipArray.filter(e => e !== getIP(socket));

    var index = ipUsernameArray.indexOf(getIP(socket))
    if (index > -1) {
      ipUsernameArray.splice(index, 1); //remove ip
      ipUsernameArray.splice(index - 1, 1); //remove username
    }

    if (user) {
      console.log(`LEFT -> User: ${getUsername(user)} | ROOM: ${user.room} | IP: ${getIP(socket)}`);

      io.to(user.room).emit("message", generateMessage(`${adminIcon}Admin`, `<i class="fa-solid fa-user-large-slash fa-lg"></i> ${user.username} has left!`));

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
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

  console.log("\n Typsnd is running at:");
  console.log(" - Local:   " + '\x1b[36m%s\x1b[0m', 'http://localhost:' + port);
  console.log(" - Network: " + '\x1b[36m%s\x1b[0m', 'http://' + ip.address() + ":" + port);
  console.log("\n Have fun using Typsnd! Check out\n more of my projects on GitHub! \n" +
    '\x1b[32m', 'http://github.com/udu3324' + '\x1b[37m', '\n');
});
