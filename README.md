<img align="right" src="https://raw.githubusercontent.com/udu3324/Typsnd/master/public/img/favicon.png?raw=true" height="200" width="200">

<img alt="GitHub" src="https://img.shields.io/github/license/udu3324/Typsnd">

<img alt="GitHub issues" src="https://img.shields.io/github/issues/udu3324/Typsnd">

<img alt="GitHub code size in bytes" src="https://img.shields.io/github/languages/code-size/udu3324/Typsnd">

# Typsnd
Typsnd. Type, send. It's as simple as that. Typsnd is a simple web app that people can chat and send images into. It is based on [Express.JS](https://expressjs.com/), [Node.JS](https://nodejs.org/), and [Socket.io.JS](https://socket.io/). 

## What it Looks Like
![1](https://raw.githubusercontent.com/udu3324/Typsnd/master/public/img/1.png)
![2](https://raw.githubusercontent.com/udu3324/Typsnd/master/public/img/2.png)
![3](https://raw.githubusercontent.com/udu3324/Typsnd/master/public/img/3.png)

## Installation and Running
Make sure you have [Node.JS](https://nodejs.org/en/download) installed. The version of Node I've tested it on was v14.15.4. 
Clone the repo and run `npm install` to install all dependencies. 
`npm run dev` will run Typsnd in development mode (nodemon)
`npm start` will run Typsnd normally

## Config.js
Optionally, there are variables you can add and modify. 
```javascript
// serverPort is the port the server will run on
var  serverPort = "3000";
// adminIPs are the admins that can change things a normal user can not
var  adminIPs = ["localhost"];
// blacklistedIPs are ips that cant join Typsnd
var  blacklistedIPs = [];
//blacklistedUsernames are the usernames a user cant choose
var  blacklistedUsernames = [];
// (why would you have this on lol) the boolean that shows ips on join
var  showIPsInChat = false;
var  msgGreet = ""; //this string is shown when a user joins typsnd
var  msgCooldown = "2"; //(second interval) message cooldown
```