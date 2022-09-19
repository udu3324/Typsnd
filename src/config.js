// Server / Moderation Config
var serverPort = 3000;
var adminIPs = ["localhost"];
var adminIcon = `<i class="fa-solid fa-shield"></i>`;
var botIcon = `<i class="fa-solid fa-keyboard"></i>`;
var altDetection = true;
var msgCooldown = "2";
// Filter is not case sensitive & doesn't apply to admins
var blacklistedUsernames = ["admin", "mod", "staff", "server", "typsnd", "code", "system"];
var blacklistedIPs = [];
//regex: ^[A-Za-z0-9!@#$%^&*()\[\]{};':",.<>\/\\|=`~?+_-]*$
var blacklistSpecialCharactarsInUsername = true;
var messageCharactarLimit = 1000;

// Chat Addons / Functionality
var htmlTitle = "Typsnd";
var msgGreet = "";
var multipleRooms = true;
var tabs = [
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

//filter variables
adminIPs = adminIPs.filter(n => n)
blacklistedIPs = blacklistedIPs.filter(n => n)
blacklistedUsernames = blacklistedUsernames.filter(n => n)
msgGreet = msgGreet.replace(/\n/g, "<br/>");
adminIcon += " " //important
botIcon += " " //important
if (msgGreet.length >= 1)
  msgGreet = "<br/>" + msgGreet

module.exports = {
  serverPort,
  adminIPs,
  adminIcon,
  altDetection,
  blacklistedIPs,
  blacklistedUsernames,
  blacklistSpecialCharactarsInUsername,
  messageCharactarLimit,
  msgGreet,
  msgCooldown,
  multipleRooms,
  tabs,
  htmlTitle,
  botIcon
};
