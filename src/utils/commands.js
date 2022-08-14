const { botIcon, adminIcon } = require("../config");
const { cLog, Color, time } = require("./logging");
const { generateMessage } = require("./messages");
const { users, getUser } = require("./users");

const botStr = `</br><span id="bot-indicator-msg"><i class="fa-solid fa-eye-slash"></i> Only you can only see this.</span>`
const crownIcon = `<i class="fa-solid fa-crown"></i>`
const arrowDownIcon = `<i class="fa-solid fa-arrow-down"></i>`

var ticTacToeGame = [];
const ticTacToeBoard = [
    ["t0", "t1", "t2"],
    ["t3", "t4", "t5"],
    ["t6", "t7", "t8"]
];
const ticTacToeWinning = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]]
];

var connect4Game = [];
const connect4Board = [
    "t0", "t1", "t2", "t3", "t4", "t5", "t6",
    "t7", "t8", "t9", "t10", "t11", "t12", "t13",
    "t14", "t15", "t16", "t17", "t18", "t19", "t20",
    "t21", "t22", "t23", "t24", "t25", "t26", "t27",
    "t28", "t29", "t30", "t31", "t32", "t33", "t34",
    "t35", "t36", "t37", "t38", "t39", "t40", "t41"
];
const connect4Winning = [
    [0, 1, 2, 3], [41, 40, 39, 38], [7, 8, 9, 10],
    [34, 33, 32, 31], [14, 15, 16, 17], [27, 26, 25, 24],
    [21, 22, 23, 24], [20, 19, 18, 17], [28, 29, 30, 31],
    [13, 12, 11, 10], [35, 36, 37, 38], [6, 5, 4, 3],
    [0, 7, 14, 21], [41, 34, 27, 20], [1, 8, 15, 22],
    [40, 33, 26, 19], [2, 9, 16, 23], [39, 32, 25, 18],
    [3, 10, 17, 24], [38, 31, 24, 17], [4, 11, 18, 25],
    [37, 30, 23, 16], [5, 12, 19, 26], [36, 29, 22, 15],
    [6, 13, 20, 27], [35, 28, 21, 14], [0, 8, 16, 24],
    [41, 33, 25, 17], [7, 15, 23, 31], [34, 26, 18, 10],
    [14, 22, 30, 38], [27, 19, 11, 3], [35, 29, 23, 17],
    [6, 12, 18, 24], [28, 22, 16, 10], [13, 19, 25, 31],
    [21, 15, 9, 3], [20, 26, 32, 38], [36, 30, 24, 18],
    [5, 11, 17, 23], [37, 31, 25, 19], [4, 10, 16, 22],
    [2, 10, 18, 26], [39, 31, 23, 15], [1, 9, 17, 25],
    [40, 32, 24, 16], [9, 7, 25, 33], [8, 16, 24, 32],
    [11, 7, 23, 29], [12, 18, 24, 30], [1, 2, 3, 4],
    [5, 4, 3, 2], [8, 9, 10, 11], [12, 11, 10, 9],
    [15, 16, 17, 18], [19, 18, 17, 16], [22, 23, 24, 25],
    [26, 25, 24, 23], [29, 30, 31, 32], [33, 32, 31, 30],
    [36, 37, 38, 39], [40, 39, 38, 37], [7, 14, 21, 28],
    [8, 15, 22, 29], [9, 16, 23, 30], [10, 17, 24, 31],
    [11, 18, 25, 32], [12, 19, 26, 33], [13, 20, 27, 34]
];

function runCommand(io, socket, user, message, admin) {
    if (/^\/help$/.test(message)) {
        sendPrivateMessage(socket, true, `<h1>Commands</h1>
            <h4>Regular Commands</h4>
            /help - shows you this<br>
            /credits - shows the credits<br>
            /tictactoe (user) - request to play tic tac toe with a user<br>
            /connect4 (user) - request to play connect 4 with a user
            <h4>Admin Commands</h4>
            /end-tictactoe - end tictactoe game forcefully<br>
            /end-connect4 - end connect4 game forcefully<br>
            /sudo (user) (message) - sudo a person
            `)
        cLog(Color.bright, `${time()} ${getUsername(user)} has looked at the command help.`)
    } else if (/^\/credits$/.test(message)) {
        sendPrivateMessage(socket, true, `<h1>Credits</h1>
            <a href="https://github.com/udu3324" target="_blank">udu3324</a> - created website<br>
            <a href="https://fontawesome.com" target="_blank">fontawesome</a> - created icons`)
        cLog(Color.bright, `${time()} ${getUsername(user)} has looked at the credits. (thank you)`)
    } else if (/^\/tictactoe/.test(message)) {
        if (message.length <= 11)
            return sendPrivateMessage(socket, true, `No user mentioned in command!`)

        var userID = getUserID(message)

        if (!userID)
            return sendPrivateMessage(socket, true, `The user you wanted to play with doesn't exist!`)

        //check if user requesting is not self
        var userSendingTo = getUser(userID)

        if (userSendingTo === user)
            return sendPrivateMessage(socket, true, `You aren't allowed to play Tic Tac Toe against yourself.`)

        //check if a game has already started
        var gameAlreadyStarted = false
        var minutes
        for (let index = 0; index < ticTacToeGame.length; ++index) {
            if (ticTacToeGame[index][0] === user.room && ticTacToeGame[index][3] !== "unaccepted") {
                gameAlreadyStarted = true
                
                //if game has lasted over 1 minute, delete it
                var diff = Math.abs(ticTacToeGame[index][6] - new Date());
                minutes = Math.floor((diff/1000)/60);
                if (minutes >= 1) {
                    gameAlreadyStarted = false
                    ticTacToeGame.splice(index, 1)
                    io.to(user.room).emit("message-split", generateMessage(`${botIcon}Bot`, "The last game of Tic Tac Toe has just expired."));
                }
            }
                
        }

        
        if (gameAlreadyStarted)
            return sendPrivateMessage(socket, true, `There's already a Tic Tac Toe game started. Wait ${1 - minutes}m for it to finish. (or join another room)`)

        //send the request
        ticTacToeGame.push(
            [
                user.room, //room game being played in
                user, //player 1 (sent req)
                userSendingTo, //player 2 (recieve req)
                "unaccepted", //status
                user, //the current turn
                [ //game board
                    ["t0", "t1", "t2"],
                    ["t3", "t4", "t5"],
                    ["t6", "t7", "t8"]
                ],
                "time" //timestamp
            ]
        )

        //to the user that wants to play game
        sendPrivateMessage(socket, true, `Waiting for ${userSendingTo.username} to accept the Tic Tac Toe game. The game will expire after 1m.`)

        //to the user that recieved the game invite
        io.to(userSendingTo.room).emit("message-split" + message.substring(11), generateMessage(`${botIcon}Bot`, `${user.username} invited you to play Tic Tac Toe. The game will expire after 1m.
            <br><button onclick="javascript:socket.emit(\`tic-tac-toe\`, \`${user.room}|accept\`)">Accept</button>
            ${botStr}`));
        cLog(Color.bright, `${time()} ${getUsername(user)} has invited ${getUsername(userSendingTo)} to a tic tac toe game.`)
    } else if (/^\/connect4/.test(message)) {
        if (message.length <= 10)
            return sendPrivateMessage(socket, true, `No user mentioned in command!`)

        var userID = getUserID(message)

        if (!userID)
            return sendPrivateMessage(socket, true, `The user you wanted to play with doesn't exist!`)

        //check if user requesting is not self
        var userSendingTo = getUser(userID)

        if (userSendingTo === user)
            return sendPrivateMessage(socket, true, `You aren't allowed to play Connect 4 against yourself.`)

        //check if a game has already started
        var gameAlreadyStarted = false
        var minutes
        for (let index = 0; index < connect4Game.length; ++index) {
            if (connect4Game[index][0] === user.room && connect4Game[index][3] !== "unaccepted") {
                gameAlreadyStarted = true

                //if game has lasted over 1 minute, delete it
                var diff = Math.abs(connect4Game[index][6] - new Date());
                minutes = Math.floor((diff/1000)/60);
                if (minutes >= 5) {
                    gameAlreadyStarted = false
                    connect4Game.splice(index, 1)
                    io.to(user.room).emit("message-split", generateMessage(`${botIcon}Bot`, "The last game of Connect 4 has just expired."));
                }
            }
        }

        if (gameAlreadyStarted)
            return sendPrivateMessage(socket, true, `There's already a Connect 4 game started. Wait ${5 - minutes}m for it to finish. (or join another room)`)

        //send the request
        connect4Game.push(
            [
                user.room, //room game being played in
                user, //player 1 (sent req)
                userSendingTo, //player 2 (recieve req)
                "unaccepted", //status
                user, //the current turn
                [ //game board
                    "t0", "t1", "t2", "t3", "t4", "t5", "t6",
                    "t7", "t8", "t9", "t10", "t11", "t12", "t13",
                    "t14", "t15", "t16", "t17", "t18", "t19", "t20",
                    "t21", "t22", "t23", "t24", "t25", "t26", "t27",
                    "t28", "t29", "t30", "t31", "t32", "t33", "t34",
                    "t35", "t36", "t37", "t38", "t39", "t40", "t41"
                ],
                "time" //timestamp
            ]
        )

        //to the user that wants to play game
        sendPrivateMessage(socket, true, `Waiting for ${userSendingTo.username} to accept the Connect 4 game. The game will expire after 5m.`)

        //to the user that recieved the game invite
        io.to(userSendingTo.room).emit("message-split" + message.substring(10), generateMessage(`${botIcon}Bot`, `${user.username} invited you to play Connect 4. The game will expire after 5m.
                <br><button onclick="javascript:socket.emit(\`connect4\`, \`${user.room}|accept\`)">Accept</button>
                ${botStr}`));
        cLog(Color.bright, `${time()} ${getUsername(user)} has invited ${getUsername(userSendingTo)} to a connect 4 game.`)

    } else if (/^\/end-connect4$/.test(message)) {
        if (!admin) return sendPrivateMessage(socket, true, `Only admins can run this command!`)

        var gameExists = false
        var gameIndex;
        for (let index = 0; index < connect4Game.length; ++index) {
            if (connect4Game[index][0] === user.room) {
                gameExists = true
                gameIndex = index
            }
        }

        if (gameExists) {
            connect4Game.splice(gameIndex, 1)
            io.to(user.room).emit("message", generateMessage(`${botIcon}Bot`, `${user.username} ended the Connect 4 game forcefully.`));
            cLog(Color.bright, `${time()} ${getUsername(user)} has force ended the connect 4 game.`)
        } else {
            sendPrivateMessage(socket, true, `There are currently no Connect 4 game to end.`)
        }
    } else if (/^\/end-tictactoe$/.test(message)) {
        if (!admin) return sendPrivateMessage(socket, true, `Only admins can run this command!`)

        var gameExists = false
        var gameIndex;
        for (let index = 0; index < ticTacToeGame.length; ++index) {
            if (ticTacToeGame[index][0] === user.room) {
                gameExists = true
                gameIndex = index
            }
        }

        if (gameExists) {
            ticTacToeGame.splice(gameIndex, 1)
            io.to(user.room).emit("message", generateMessage(`${botIcon}Bot`, `${user.username} ended the Tic Tac Toe game forcefully.`));
            cLog(Color.bright, `${time()} ${getUsername(user)} has force ended the tic tac toe game.`)
        } else {
            sendPrivateMessage(socket, true, `There are currently no Tic Tac Toe game to end.`)
        }
    } else if (/^\/sudo/.test(message)) {
        if (!admin) return sendPrivateMessage(socket, true, `Only admins can run this command!`)

        if (message.length <= 6) return sendPrivateMessage(socket, true, `No user mentioned in command!`)

        var spaceIndex = message.indexOf(" ", 7)
        if (spaceIndex === -1) return sendPrivateMessage(socket, true, `No message in command!`)

        var userSendTo = message.substring(6, spaceIndex)
        var messageSudoing = message.substring(spaceIndex + 1)
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

        if (!userExists) return sendPrivateMessage(socket, true, `The user you want to sudo doesn't exist!`)

        var userSudoing = getUser(userID)

        if (userSudoing.username.includes(adminIcon, "")) return sendPrivateMessage(socket, true, `The user you wanted to sudo is a admin!`)

        io.to(user.room).emit("message", generateMessage(userSudoing.username, messageSudoing));
        cLog(Color.bright, `${time()} ${getUsername(userSudoing)} has been sudoed. (by user: ${getUsername(user)})`)
    }
}

function getUsername(user) {
    if (user.username === undefined)
        return user.replace(`${adminIcon}`, "(admin) ");
    else
        return user.username.replace(`${adminIcon}`, "(admin) ");
}

function sendPrivateMessage(socket, split, message) {
    if (split)
        socket.emit("message-split", generateMessage(`${botIcon}Bot`, `${message}${botStr}`));
    else
        socket.emit("message", generateMessage(`${botIcon}Bot`, `${message}${botStr}`));
}

function generateNewTTTBoard(gameIndex) {
    const user1 = ticTacToeGame[gameIndex][1]
    const user2 = ticTacToeGame[gameIndex][2]
    const currentTurn = ticTacToeGame[gameIndex][4]

    var endingString;

    if (ticTacToeGame[gameIndex][3] === "finished")
        endingString = `${crownIcon}${crownIcon}${crownIcon} ${currentTurn.username} wins! ${crownIcon}${crownIcon}${crownIcon}`
    else if (ticTacToeGame[gameIndex][3] === "tied")
        endingString = `The game has tied.`
    else
        endingString = `It is ${currentTurn.username}'s turn.`

    return `
    <h2><i class="fa-solid fa-xmark"></i> ${user1.username} vs ${user2.username} <i class="fa-solid fa-o"></i></h2>
    <div id="tictactoe-gameboard">
        <div style="border-style: none solid solid none;" class="ttt-square">
            ${generateTileTTT("t0", gameIndex)}
        </div>
        <div style="border-style: none solid solid solid;" class="ttt-square">
            ${generateTileTTT("t1", gameIndex)}
        </div>
        <div style="border-style: none none solid solid;" class="ttt-square">
            ${generateTileTTT("t2", gameIndex)}
        </div>
        <br>
        <div style="border-style: solid solid solid none;" class="ttt-square">
            ${generateTileTTT("t3", gameIndex)}
        </div>
        <div style="border-style: solid;" class="ttt-square">
            ${generateTileTTT("t4", gameIndex)}
        </div>
        <div style="border-style: solid none solid solid;" class="ttt-square">
            ${generateTileTTT("t5", gameIndex)}
        </div>
        <br>
        <div style="border-style: solid solid none none;" class="ttt-square">
            ${generateTileTTT("t6", gameIndex)}
        </div>
        <div style="border-style: solid solid none solid;" class="ttt-square">
            ${generateTileTTT("t7", gameIndex)}
        </div>
        <div style="border-style: solid none none solid;" class="ttt-square">
            ${generateTileTTT("t8", gameIndex)}
        </div>
    </div>
    <br>
    ${endingString}
    `
}

function generateTileTTT(tile, gameIndex) {
    const tileIndex = indexOf2dArray(ticTacToeBoard, tile)
    const tileStatus = ticTacToeGame[gameIndex][5][tileIndex[0]][tileIndex[1]]
    if (tileStatus === "X")
        return `<i class="fa-solid fa-xmark"></i>`
    else if (tileStatus === "O")
        return `<i class="fa-solid fa-o fa-xs"></i>`
    else
        return `<button class="ttt-button" onclick="javascript:socket.emit(\`tic-tac-toe\`, \`${ticTacToeGame[gameIndex][0]}|${tile}\`)"></button>`
}

function checkWinTTT(gameIndex) {
    var won = false
    var marker;

    //set marker depending on whos turn it is
    if (ticTacToeGame[gameIndex][4] === ticTacToeGame[gameIndex][1])
        marker = "X"
    else
        marker = "O"

    //for each way to win, check the current state of game to see if won
    for (let i = 0; i < ticTacToeWinning.length; i++) {
        var tile1 = ticTacToeWinning[i][0]
        var tile2 = ticTacToeWinning[i][1]
        var tile3 = ticTacToeWinning[i][2]

        var gTile1 = ticTacToeGame[gameIndex][5][tile1[0]][tile1[1]]
        var gTile2 = ticTacToeGame[gameIndex][5][tile2[0]][tile2[1]]
        var gTile3 = ticTacToeGame[gameIndex][5][tile3[0]][tile3[1]]

        if (gTile1 === marker && gTile2 === marker && gTile3 === marker) {
            won = true
            break
        }
    }
    return won
}

function checkTieTTT(array) {
    var didTie = true
    for (var x = 0; x < array.length; x++) {
        for (var y = 0; y < array.length; y++) {
            if (array[y][x].includes("t"))
                didTie = false
        }
    }
    return didTie
}

function indexOf2dArray(array, item) {
    for (var x = 0; x < array.length; x++) {
        for (var y = 0; y < array.length; y++) {
            if (array[y][x] === item)
                return [y, x]
        }
    }
    return false
}

function getUserID(message) {
    //check if the user requesting exists
    var userSendTo = message.substring(message.indexOf(" ") + 1)
    var userExists = false;
    var userID;

    for (let index = 0; index < users.length; ++index) {
        //remove the admin icon
        if (users[index].username.replace(adminIcon, "") === userSendTo) {
            userID = users[index].id;
            userExists = true
            break;
        }
    }

    if (userExists)
        return userID
    else
        return null
}

function generateNewConnect4Board(gameIndex) {
    const room = connect4Game[gameIndex][0]
    const user1 = connect4Game[gameIndex][1]
    const user2 = connect4Game[gameIndex][2]
    const currentTurn = connect4Game[gameIndex][4]

    var startingDOM = `
    <h2>🔴 ${user1.username} vs ${user2.username} 🟡</h2>
    <div id="connect4-gameboard">`

    var endingString;
    if (connect4Game[gameIndex][3] === "finished")
        endingString = `${crownIcon}${crownIcon}${crownIcon} ${currentTurn.username} wins! ${crownIcon}${crownIcon}${crownIcon}`
    else if (connect4Game[gameIndex][3] === "tied")
        endingString = `The game has tied.`
    else
        endingString = `It is ${currentTurn.username}'s turn.`

    var endingDOM = `
    </div>
    <br>
    ${endingString}`

    var middleDOM = `
    <button style="margin-left: 5px;" class="connect4-button" onclick="javascript:socket.emit(\`connect4\`, \`${room}|0\`)">${arrowDownIcon}</button>
    <button class="connect4-button" onclick="javascript:socket.emit(\`connect4\`, \`${room}|1\`)">${arrowDownIcon}</button>
    <button class="connect4-button" onclick="javascript:socket.emit(\`connect4\`, \`${room}|2\`)">${arrowDownIcon}</button>
    <button class="connect4-button" onclick="javascript:socket.emit(\`connect4\`, \`${room}|3\`)">${arrowDownIcon}</button>
    <button class="connect4-button" onclick="javascript:socket.emit(\`connect4\`, \`${room}|4\`)">${arrowDownIcon}</button>
    <button class="connect4-button" onclick="javascript:socket.emit(\`connect4\`, \`${room}|5\`)">${arrowDownIcon}</button>
    <button class="connect4-button" onclick="javascript:socket.emit(\`connect4\`, \`${room}|6\`)">${arrowDownIcon}</button>
    <br>`;

    for (var i = 0; i < connect4Game[gameIndex][5].length; i++) {
        var tile = connect4Game[gameIndex][5][i]
        if (tile === "red")
            middleDOM += "🔴"
        else if (tile === "yellow")
            middleDOM += "🟡"
        else
            middleDOM += "⚪"

        //add br if 7 multiple
        if (i == 6 || i == 13 || i == 20 || i == 27 || i == 34)
            middleDOM += "<br>"
    }

    return startingDOM + middleDOM + endingDOM
}

function placeConnect4Tile(gameIndex, row) {
    //set the tile color
    var tileColor;
    if (connect4Game[gameIndex][4] === connect4Game[gameIndex][1])
        tileColor = "red"
    else
        tileColor = "yellow"

    //check if the row is already filled
    if (!/^t/.test(connect4Game[gameIndex][5][parseInt(row)])) return true

    //place the tile
    for (var i = 0; i < 7; i++) {
        var tileIndex = parseInt(row) + (i * 7)
        var tile = connect4Game[gameIndex][5][tileIndex]

        //place the tile when loop hits already placed tile
        if (!/^t/.test(tile)) {
            connect4Game[gameIndex][5][tileIndex - 7] = tileColor
            break
        }
    }
}

function checkWinConnect4(gameIndex) {
    var won = false

    var tileColor;
    if (connect4Game[gameIndex][4] === connect4Game[gameIndex][1])
        tileColor = "red"
    else
        tileColor = "yellow"

    //for each way to win, check the current state of game to see if won
    for (let i = 0; i < connect4Winning.length; i++) {
        //[#, #, #, #]
        var winningTiles = connect4Winning[i]

        //get the tiles requested
        var tile1 = connect4Game[gameIndex][5][winningTiles[0]]
        var tile2 = connect4Game[gameIndex][5][winningTiles[1]]
        var tile3 = connect4Game[gameIndex][5][winningTiles[2]]
        var tile4 = connect4Game[gameIndex][5][winningTiles[3]]

        if (tile1 === tileColor && tile2 === tileColor && tile3 === tileColor && tile4 === tileColor)
            won = true
    }

    return won
}

module.exports = {
    runCommand,
    ticTacToeGame,
    generateNewTTTBoard,
    indexOf2dArray,
    checkWinTTT,
    checkTieTTT,
    connect4Game,
    generateNewConnect4Board,
    placeConnect4Tile,
    checkWinConnect4
}