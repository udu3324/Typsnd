const { botIcon, adminIcon } = require("../config");
const { cLog, Color, time } = require("./logging");
const { generateMessage } = require("./messages");
const { users, getUser } = require("./users");

const botStr = `</br><span id="bot-indicator-msg"><i class="fa-solid fa-eye-slash"></i> Only you can only see this.</span>`
const crownIcon = `<i class="fa-solid fa-crown"></i>`
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

function runCommand(io, socket, user, message, admin) {
    if (/^\/help$/.test(message)) {
        sendPrivateMessage(socket, true, `<h1>Commands</h1>
            <h4>Regular Commands</h4>
            /help - shows you this<br>
            /credits - shows the credits<br>
            /tictactoe (user) - request to play tic tac toe with a user
            <h4>Admin Commands</h4>
            /end-tictactoe - end tictactoe game forcefully<br>
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

        var userSendTo = message.substring(11)
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

        if (!userExists)
            return sendPrivateMessage(socket, true, `The user you wanted to play with doesn't exist!`)

        var userSendingTo = getUser(userID)

        if (userSendingTo === user)
            return sendPrivateMessage(socket, true, `You aren't allowed to play Tic Tac Toe against yourself.`)

        var gameAlreadyStarted = false
        var statusOfGame
        for (let index = 0; index < ticTacToeGame.length; ++index) {
            if (ticTacToeGame[index][0] === user.room) {
                gameAlreadyStarted = true
                statusOfGame = ticTacToeGame[index][3]
            }
        }

        if (statusOfGame === "unaccepted")
            gameAlreadyStarted = false

        if (gameAlreadyStarted)
            return sendPrivateMessage(socket, true, `Sorry, but there is already a Tic Tac Toe game started. Please wait for it to finish. (or you can join another room)`)

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
                ]
            ]
        )

        //to the user that wants to play game
        sendPrivateMessage(socket, true, `Waiting for ${userSendingTo.username} to accept the Tic Tac Toe game.`)

        //to the user that recieved the game invite
        io.to(userSendingTo.room).emit("message-split" + userSendTo, generateMessage(`${botIcon}Bot`, `${user.username} invited you to play Tic Tac Toe.
            <br><button onclick="javascript:socket.emit(\`tic-tac-toe\`, \`${user.room}|accept\`)">Accept</button>
            ${botStr}`));
        cLog(Color.bright, `${time()} ${getUsername(user)} has invited ${getUsername(userSendingTo)} to a tic tac toe game.`)
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

function indexOf2dArray(array, item) {
    for (var x = 0; x < array.length; x++) {
        for (var y = 0; y < array.length; y++) {
            if (array[y][x] === item)
                return [y, x]
        }
    }
    return false
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

module.exports = {
    runCommand,
    ticTacToeGame,
    generateNewTTTBoard,
    indexOf2dArray,
    checkWinTTT,
    checkTieTTT
}