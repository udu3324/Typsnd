<img align="right" src="https://raw.githubusercontent.com/udu3324/Typsnd/master/public/img/favicon.png?raw=true" height="200" width="200">

<img alt="GitHub" src="https://img.shields.io/github/license/udu3324/Typsnd">

<img alt="GitHub issues" src="https://img.shields.io/github/issues/udu3324/Typsnd">

<img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/udu3324/Typsnd">

# Typsnd
Typsnd. Type, send. It's as simple as that. Typsnd is a simple web app that people can chat and send images into. It is based on [Express.JS](https://expressjs.com/), [Node.JS](https://nodejs.org/), and [Socket.io.JS](https://socket.io/).
   
**Features**   
 - Mobile/Small Screen Support!!!!
 - Commands (tictactoe and connect4)
 - Moderation (ban, kick, alert)
 - Tabs (easy to access button links)
 - Direct Messaging
 - Mentioning
 - Typing Indicator
 - Chat Cooldown
 - XSS Detection (disabled for admins)
 - And more!

## Sample Server
You can try out Typsnd using this link: [https://Typsnd.potatochips3.repl.co](https://Typsnd.potatochips3.repl.co)

## What it Looks Like
![1](https://raw.githubusercontent.com/udu3324/Typsnd/master/public/img/1.png)
![2](https://raw.githubusercontent.com/udu3324/Typsnd/master/public/img/2.png)
![3](https://raw.githubusercontent.com/udu3324/Typsnd/master/public/img/3.png)

## Installation and Running
Make sure you have [Node.JS](https://nodejs.org/en/download) installed. The version of Node I've tested it on was v14.15.4. 

Clone the repo and run `npm install` to install all dependencies. 

`npm run dev` will run Typsnd in development mode (nodemon) and `npm start` will run Typsnd normally

⚠ Warning for Production/Public Uses ⚠

⚠ Please combine chat.js with moderation.js to then [obfuscate](https://obfuscator.io/) them. This is to prevent code manipulation. ⚠

## Config.js
Optionally, there are variables you can add and modify. 
```javascript
// Server / Moderation Config
export let serverPort = 3000;
export let adminIPs = ["localhost"];
export let adminIcon = `<i class="fa-solid fa-shield"></i>`;
export let botIcon = `<i class="fa-solid fa-keyboard"></i>`;
export let altDetection = true;
export let msgCooldown = "2";
// Filter is not case sensitive & doesn't apply to admins
export let blacklistedUsernames = ["admin", "mod", "staff", "server", "typsnd", "code", "system"];
export let blacklistedIPs = [];
//regex: ^[A-Za-z0-9!@#$%^&*()\[\]{};':",.<>\/\\|=`~?+_-]*$
export let blacklistSpecialCharactarsInUsername = true;
export let messageCharactarLimit = 1000;

// Chat Addons / Functionality
export let htmlTitle = "Typsnd";
export let msgGreet = "";
export let multipleRooms = true;
export let tabs = [
  //example tabs
  [
    [`<i class="fa-brands fa-github"></i> Github`],
    [`https://github.com/udu3324/Typsnd`]
  ],
  [
    [`<i class="fa-brands fa-youtube"></i> Youtube`],
    [`https://youtube.com`]
  ]
];
```
