const path = require("path");
const http = require("http");
const express = require("express");
const URI = require("urijs");
const ip = require('ip');
const { generateMessage } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom, users } = require("./utils/users");
const { serverPort, blacklistedIPs, msgGreet, adminIPs, tabs, adminIcon, altDetection, htmlTitle } = require("./config.js");
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


// this array is used to store the ips of the users connected to Typsnd
var ipArray = [];

io.on("connection", socket => {
  let ip = getIP(socket);

  var isAlt = ipArray.some(v => ip.includes(v));
  var isBlacklisted = blacklistedIPs.some(v => ip.includes(v));

  if (isAlt && altDetection) {
    socket.emit("alt-kick")
    console.log("CONNECTION -|-> IP.ALT: " + ip);
  } else if (isBlacklisted) {
    socket.emit("blacklisted-ip-kick")
    console.log("CONNECTION -|-> IP.BLACKLISTED: " + ip);
  } else {

    // allow them to connect
    if (isAlt && !altDetection) {
      console.log("CONNECTION ---> IP.ALT: " + ip);
    } else {
      console.log("CONNECTION ---> IP: " + ip);
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

      socket.emit("message", generateMessage(`${adminIcon}Admin`, `Welcome, ${user.username}! ${msgGreet}`));
      socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `${user.username} has joined!`));

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });

      //add ip to ip list, set msg cooldown, and set admin status
      ipArray.push(ip);
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

    // check if msg is over 3000 charactars
    if (msg.length > 3000) {
      console.log(`Message from ${getUsername(user)} has been blocked due to charactar limit.`);
      msg = `Hi, I'm ${getUsername(user)} and just tried to go over the 3000 charactar limit.`;
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
      if (users[index].username.replace("<i class=\"fa-solid fa-shield\"></i> ", "") === userSendTo) {
        userID = users[index].id;
        userExists = true
      }
    }

    //check if message is over 280
    if (userMessage.length > 280) {
      console.log("IP: " + ip + " has tried to bypass the 280 charactar limit!")
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
    // check if user is actually a admin
    if (adminIPs.some(v => ip.includes(v))) {
      msgCooldown = seconds;
      socket.emit("message-cooldown", msgCooldown);

      console.log("New message cooldown is " + msgCooldown + " seconds. (set by ip: " + ip + ")")
    } else {
      console.log("IP: " + ip + " has tried to set cooldown without having admin!")
    }
  });

  socket.on("kickUser", (username) => {
    const user = getUser(socket.id);

    // check if user is actually a admin
    if (adminIPs.some(v => ip.includes(v))) {
      io.to(user.room).emit("kick", username);

      console.log("User: " + username + " has been kicked. (kicked by ip: " + ip + ")")
    } else {
      console.log("IP: " + ip + " has tried to kick someone without having admin!")
    }
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    //remove ip from list when they leave
    ipArray = ipArray.filter(e => e !== getIP(socket));

    if (user) {
      console.log(`LEFT -> User: ${getUsername(user)} | ROOM: ${user.room} | IP: ${getIP(socket)}`);

      io.to(user.room).emit("message", generateMessage(`${adminIcon}Admin`, `${user.username} has left!`));

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
