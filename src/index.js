const path = require("path");
const http = require("http");
const express = require("express");
const ip = require('ip');
const { generateMessage, linkify } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom, users } = require("./utils/users");
var { msgCooldown, serverPort, blacklistedIPs, msgGreet, adminIPs, tabs, adminIcon, altDetection, htmlTitle, blacklistedUsernames, botIcon } = require("./config.js");
const { encode } = require("html-entities");

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const { cLog, Color, time } = require("./utils/logging");
const { createSave, writeSave, readSave, deleteSave } = require("./utils/writer");
const { runCommand, ticTacToeGame, generateNewTTTBoard, indexOf2dArray, checkWin, checkWinTTT, checkTieTTT } = require("./utils/commands");

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

var ipArray = [];
var ipUsernameArray = [];
var banArray = [];
var usersTypingArray = [];

var dotsNumber = 0
function dots() {
  return ".".repeat((dotsNumber++) % 3 + 1)
}

setInterval(function () {
  //for each room
  for (let index = 0; index < usersTypingArray.length; ++index) {
    //send packet for specific amount
    var room = usersTypingArray[index][0]
    if (usersTypingArray[index].length >= 7) {
      sendToSpecificRoom(room, "usr-type", `${usersTypingArray[index].length} users are currently typing${dots()}`)
    } else if ((usersTypingArray[index].length >= 4)) {
      var stringOfUsers = usersTypingArray[index].toString().replace(/,([^,]*)$/, ' and $1').replaceAll(",", ", ").substring(usersTypingArray[index].toString().indexOf(",") + 2)
      sendToSpecificRoom(room, "usr-type", `${stringOfUsers} are typing${dots()}`)
    } else if ((usersTypingArray[index].length === 3)) {
      sendToSpecificRoom(room, "usr-type", `${usersTypingArray[index][1]} and ${usersTypingArray[index][2]} are typing${dots()}`)
    } else if ((usersTypingArray[index].length === 2)) {
      sendToSpecificRoom(room, "usr-type", `${usersTypingArray[index][1]} is typing${dots()}`)
    } else if ((usersTypingArray[index].length === 1)) {
      sendToSpecificRoom(room, "usr-type", ``)
    }
  }
}, 500)

io.on("connection", socket => {
  let ip = getIP(socket);

  var isAlt = ipArray.some(v => ip.includes(v));
  var isBlacklisted = blacklistedIPs.some(v => ip.includes(v));
  var isBanned = banArray.some(v => ip.includes(v));

  //filter connection
  if (isAlt && altDetection) {
    socket.emit("alt-kick")
    return cLog(Color.bg.red, `${time()} CONNECTION × IP.ALT: ${ip}`);
  }

  if (isBlacklisted) {
    socket.emit("blacklisted-ip-kick")
    return cLog(Color.bg.red, `${time()} CONNECTION × IP.BLACKLISTED: ${ip}`);
  }

  if (isBanned) {
    socket.emit("ban", "authenticatedFromSocketServer")
    return cLog(Color.bg.red, `${time()} CONNECTION × IP.BANNED: ${ip}`);
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
    if (error) return callback(error)

    socket.join(user.room);
    cLog(Color.bg.green, `${time()} JOIN -> USER: ${getUsername(user)} | ROOM: ${user.room} | IP: ${getIP(socket)}`);

    //join and welcome message
    socket.emit("message", generateMessage(`${botIcon}Bot`, `Welcome, ${user.username}!</br>Type "/help" to see commands. ${msgGreet}`));
    socket.broadcast.to(user.room).emit("message", generateMessage(`${botIcon}Bot`, `<i class="fa-solid fa-user-check fa-lg"></i> ${user.username} has joined!`));

    //send new room data
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    //add ip to arrays
    ipArray.push(ip);

    var alreadyHas = false
    //add room to usersTypingArray
    for (let index = 0; index < usersTypingArray.length; ++index) {
      if (usersTypingArray[index][0] === user.room) {
        alreadyHas = true
        break
      }
    }
    if (!alreadyHas)
      usersTypingArray.push([user.room])

    ipUsernameArray.push(user.username)
    ipUsernameArray.push(ip)

    //send user if they're an admin and what the admin icon is
    var adminArr = [adminIPs.some(v => ip.includes(v)), adminIcon]
    socket.emit("admin-status", adminArr)

    socket.emit("starting-data", [tabs, msgCooldown, htmlTitle])

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    var msg = message;

    //check for command
    if (/^\//.test(message)) {
      runCommand(io, socket, user, message, admin)
      socket.emit("message-cooldown", msgCooldown);
      return callback()
    }

    //check for xss and remove unsafe tags if not admin
    if (!admin) {
      if (DOMPurify.sanitize(msg) !== message) {
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

    socket.emit("message-cooldown", msgCooldown);
    io.to(user.room).emit("message", generateMessage(user.username, linkify(msg)));

    cLog(Color.reset, `${time()} MESSAGE > USER: ${getUsername(user)} | ROOM: ${user.room} | IP: ${getIP(socket)}`);
    callback();
  });

  socket.on("sendImage", (base64, callback) => {
    const user = getUser(socket.id);

    if (DOMPurify.sanitize(base64) !== base64) {
      cLog(Color.bg.red, `${time()} Message from ${getUsername(user)} has been blocked due to XSS.`);
      return callback("Refresh the page!")
    }

    socket.emit("message-cooldown", msgCooldown);
    io.to(user.room).emit("image", generateMessage(user.username, "<img id=\"uploaded-image\" alt=\"image\" src=\"" + base64 + "\">"));

    cLog(Color.reset, `${time()} IMAGE > User: ${getUsername(user)} | ROOM: ${user.room} | IP: ${getIP(socket)}`);
    callback();
  });

  socket.on("sendDirectMessage", (packet, callback) => {
    const userSentFrom = getUser(socket.id);
    const userSendTo = packet[0];
    var userMessage = packet[1];

    //check if user sending to is real
    var userExists = false;
    var userID;

    for (let index = 0; index < users.length; ++index) {
      //remove shield
      if (users[index].username.replace(adminIcon, "") === userSendTo) {
        userID = users[index].id;
        userExists = true
        break;
      }
    }

    //check for xss and remove unsafe tags if not admin
    if (!admin) {
      if (DOMPurify.sanitize(userMessage) !== userMessage) {
        cLog(Color.bg.red, `${time()} Direct Message from ${getUsername(userSentFrom)} to ${userSendTo} has been blocked due to XSS.`);
        return callback("bad")
      }

      // convert &, <, >, ", ' into entities
      userMessage = encode(userMessage).replace("&amp;lt;", "&lt;").replace("&amp;gt;", "&gt;");
    }

    //check if message is over 280
    if (userMessage.length > 280) {
      cLog(Color.bg.red, `${time()} IP: ${ip} has tried to bypass the 280 character limit!`)
      return callback("Message is over 280!");
    }

    if (!userExists) return callback("User does not exist!");

    //send to that user
    var userSendingTo = getUser(userID)

    var packetOut = [userSentFrom.username, linkify(userMessage)]
    io.to(userSendingTo.room).emit("recieveDirectMessage" + userSendTo, packetOut);

    cLog(Color.reset, `${time()} DM > FROM: ${getUsername(userSentFrom)} | TO: ${userSendTo}`)
    callback();
  });

  socket.on("typing", () => {
    const user = getUser(socket.id);

    //get index of room in usersTypingArray and return if not found
    var indexOfRoom = -1
    for (let index = 0; index < usersTypingArray.length; ++index) {
      if (usersTypingArray[index][0] === user.room) {
        indexOfRoom = index
        break
      }
    }

    if (indexOfRoom === -1) return cLog(Color.bg.red, `${time()} Room ${user.room} cant be found! Error is from ${getUsername(user)}`)

    //if user is not in typing array, add it and delete in 1 second
    if (usersTypingArray[indexOfRoom].indexOf(user.username, 1) !== -1) return

    usersTypingArray[indexOfRoom].push(user.username)

    setTimeout(
      function () {
        usersTypingArray[indexOfRoom].splice(usersTypingArray[indexOfRoom].indexOf(user.username), 1);
      }, 1000);
  });

  socket.on("setCooldown", (seconds) => {
    if (!admin) return cLog(Color.bg.red, `${time()} IP: ${ip} has tried to set cooldown without having admin!`)

    msgCooldown = seconds;
    writeSave("cooldown", seconds)
    sendToAllRooms("message-cooldown", msgCooldown)

    cLog(Color.bright, `${time()} New message cooldown is ${msgCooldown} second(s). (set by ip: ${ip})`)

    sendToAllRooms("message", generateMessage(`${botIcon}Bot`, `<i class="fa-solid fa-stopwatch fa-lg"></i> The message cooldown has been set to ${seconds} second(s).`))
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

    if (!userExists) return callback("notExistingUser")

    io.to(userModerationObject.room).emit("kick", username);

    cLog(Color.bright, `${time()} User: ${username} has been kicked. (kicked by ip: ${ip})`)
    sendToAllRooms("message", generateMessage(`${botIcon}Bot`, `<i class="fa-solid fa-xmark fa-lg"></i> ${username} has been kicked.`));
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
          break;
        } else {
          return callback("isAdmin");
        }
      }
    }

    if (!userExists) return callback("notExistingUser");

    //ban them
    io.to(userModerationObject.room).emit("ban", username);

    //ban their username from being used
    blacklistedUsernames.push(username)

    //find their ip
    var indexOfIP = ipUsernameArray.indexOf(username) + 1

    //add to array of ban
    banArray.push(username)
    banArray.push(ipUsernameArray[indexOfIP])

    //save to save.txt
    writeSave("ban-array", JSON.stringify(banArray))
    writeSave("blacklisted-usernames", JSON.stringify(blacklistedUsernames))

    cLog(Color.bright, `${time()} User: ${username} has been banned. (banned by ip: ${ip})`)
    sendToAllRooms("message", generateMessage(`${botIcon}Bot`, `<i class="fa-solid fa-gavel fa-lg"></i> ${username} has been banned.`));

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
        break;
      }
    }

    if (!userExists) {
      //send a list of banned people if username entered is wrong
      var listOfBannedPeople = "User provided was invalid. See list below for unbannable people! \n\nList of Banned Users:\n"

      //write a list of banned people (not their ips) only if there are any
      if (banArray.length != 0)
        for (let index = 0; index < banArray.length; index = index + 2) {
          listOfBannedPeople = listOfBannedPeople + banArray[index] + "\n"
        }
      else
        listOfBannedPeople = listOfBannedPeople + "none"

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

    //save to save.txt
    writeSave("ban-array", JSON.stringify(banArray))
    writeSave("blacklisted-usernames", JSON.stringify(blacklistedUsernames))

    cLog(Color.bright, `${time()} User: ${username} has been unbanned. (unbanned by ip: ${ip})`)
    sendToAllRooms("message", generateMessage(`${botIcon}Bot`, `<i class="fa-solid fa-gavel fa-lg"></i> ${username} has been unbanned.`));

    callback("good");
  });

  socket.on("alert", (message, callback) => {
    if (!admin) {
      cLog(Color.bg.red, `${time()} !!!!! IP: ${ip} has tried to alert everyone without having Admin !!!!!`)
      return callback("bad");
    }

    //filter msg length
    if (message.length < 3) return callback("short")

    if (message.length > 70) return callback("long")

    sendToAllRooms("alert", linkify(message))
    cLog(Color.bright, `${time()} IP: ${ip} has sent a alert to everyone. ALERT = ${message}`)

    callback("good");
  });

  socket.on("disconnect", () => {
    const userRemove = removeUser(socket.id);

    if (!userRemove) return;

    //remove ip from list when they leave
    ipArray = ipArray.filter(e => e !== getIP(socket));

    var index = ipUsernameArray.indexOf(getIP(socket))
    if (index > -1) {
      ipUsernameArray.splice(index, 1); //remove ip
      ipUsernameArray.splice(index - 1, 1); //remove username
    }

    cLog(Color.bg.blue, `${time()} LEFT -> User: ${getUsername(userRemove)} | ROOM: ${userRemove.room} | IP: ${getIP(socket)}`);

    io.to(userRemove.room).emit("message", generateMessage(`${botIcon}Bot`, `<i class="fa-solid fa-user-xmark fa-lg"></i> ${userRemove.username} has left!`));

    io.to(userRemove.room).emit("roomData", {
      room: userRemove.room,
      users: getUsersInRoom(userRemove.room)
    });
  });

  socket.on("tic-tac-toe", (packet) => {
    const user = getUser(socket.id);

    const room = packet.substring(0, packet.indexOf("|"))
    const doing = packet.substring(packet.indexOf("|") + 1)

    //find where the game is stored in the array
    var gameIndex;
    for (let index = 0; index < ticTacToeGame.length; ++index) {
      if (ticTacToeGame[index][0] === room)
        gameIndex = index
    }

    if (gameIndex == undefined) return //return if cant find

    const user1 = ticTacToeGame[gameIndex][1]
    const user2 = ticTacToeGame[gameIndex][2]

    //only allow sockets with people that started game
    if (!(user === user1 || user === user2)) return

    const status = ticTacToeGame[gameIndex][3]

    if (status === "unaccepted" && doing === "accept") {
      io.to(room).emit("message-split", generateMessage(`${botIcon}Bot`, generateNewTTTBoard(gameIndex)));
      ticTacToeGame[gameIndex][3] = "started"
    } else if (status === "started" && /^t[0-8]$/.test(doing)) {
      const currentTurn = ticTacToeGame[gameIndex][4]

      if (user !== currentTurn) return //if not users turn

      var indexOfTile = indexOf2dArray(ticTacToeGame[gameIndex][5], doing)
      if (indexOfTile === false) return //return if cant find

      //place the marker
      if (currentTurn === user1)
        ticTacToeGame[gameIndex][5][indexOfTile[0]][indexOfTile[1]] = "X"
      else
        ticTacToeGame[gameIndex][5][indexOfTile[0]][indexOfTile[1]] = "O"

      //check for win
      var playerWon = checkWinTTT(gameIndex)
      var playerTie = checkTieTTT(ticTacToeGame[gameIndex][5])

      if (playerWon) {
        ticTacToeGame[gameIndex][3] = "finished"
      } else if (playerTie) {
        ticTacToeGame[gameIndex][3] = "tied"
      } else {
        //switch the current turn
        if (currentTurn === user1)
          ticTacToeGame[gameIndex][4] = ticTacToeGame[gameIndex][2]
        else
          ticTacToeGame[gameIndex][4] = ticTacToeGame[gameIndex][1]
      }

      io.to(room).emit("message-split", generateMessage(`${botIcon}Bot`, generateNewTTTBoard(gameIndex)));

      if (playerWon || playerTie)
        ticTacToeGame.splice(gameIndex, 1)
    }
  })
}

function sendToAllRooms(event, string) {
  var roomsSentTo = [""]
  for (let index = 0; index < users.length; ++index) {
    if (roomsSentTo.includes(users[index].room)) return

    io.to(users[index].room).emit(event, string);
    roomsSentTo.push(users[index].room)
  }
}

function sendToSpecificRoom(room, event, string) {
  for (let index = 0; index < users.length; ++index) {
    if (users[index].room === room) {
      io.to(users[index].room).emit(event, string)
      break
    }
  }
}

function getIP(socket) {
  let ip = socket.handshake.address.substring(7);
  if (ip === "" || ip === "127.0.0.1")
    ip = "localhost";

  return ip;
}

function getUsername(user) {
  if (user.username === undefined)
    return user.replace(`${adminIcon}`, "(admin) ");
  else
    return user.username.replace(`${adminIcon}`, "(admin) ");
}

server.listen(port, () => { //credits n stuff
  console.log("\n Typsnd is running at: \n");
  cLog(Color.fg.cyan, `http://localhost:${port}`, ` - Local:   `)
  cLog(Color.fg.cyan, `http://${ip.address()}:${port} \n`, ` - Network: `)

  createSave()

  //set variables from save.txt instead of config.js
  if (readSave("cooldown") !== false) {
    if (readSave("cooldown") === msgCooldown) {
      deleteSave("cooldown")
    } else {
      console.log(`save.txt | using a cooldown of ${readSave("cooldown")} instead of ${msgCooldown}`)
      msgCooldown = readSave("cooldown")
    }
  }

  if (readSave("blacklisted-usernames") !== false) {
    if (readSave("blacklisted-usernames") === JSON.stringify(blacklistedUsernames)) {
      deleteSave("blacklisted-usernames")
    } else {
      console.log(`save.txt | using a blacklist-username of ${readSave("blacklisted-usernames")} instead of ${JSON.stringify(blacklistedUsernames)}`)
      blacklistedUsernames = JSON.parse(readSave("blacklisted-usernames"))
    }
  }

  if (readSave("ban-array") !== false) {
    if (readSave("ban-array") === JSON.stringify(banArray)) {
      deleteSave("ban-array")
    } else {
      banArray = JSON.parse(readSave("ban-array"))
      console.log(`save.txt | using a ban array of ${readSave("ban-array")} instead of ${JSON.stringify(banArray)}`)
    }
  }
});