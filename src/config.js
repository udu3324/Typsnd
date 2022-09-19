// Server / Moderation Config
let serverPort = 3000;
let adminIPs = ["localhost"];
let adminIcon = `<i class="fa-solid fa-shield"></i>`;
let botIcon = `<i class="fa-solid fa-keyboard"></i>`;
let altDetection = true;
let msgCooldown = "2";
// Filter is not case sensitive & doesn't apply to admins
let blacklistedUsernames = ["admin", "mod", "staff", "server", "typsnd", "code", "system"];
let blacklistedIPs = [];
//regex: ^[A-Za-z0-9!@#$%^&*()\[\]{};':",.<>\/\\|=`~?+_-]*$
let blacklistSpecialCharactarsInUsername = true;
let messageCharactarLimit = 1000;

// Chat Addons / Functionality
let htmlTitle = "Typsnd";
let msgGreet = "";
let multipleRooms = true;
let tabs = [
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

export default {
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
