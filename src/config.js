
// Server/Moderation Config
var serverPort = 3000;
var adminIPs = ["localhost"];
var adminIcon = "<i class=\"fa-solid fa-shield\"></i> ";
var altDetection = true;
var blacklistedIPs = [];
var blacklistedUsernames = [];
var msgCooldown = "2";

// Chat Addons/Functionality
var htmlTitle = "Typsnd";
var msgGreet = "";
var multipleRooms = true;
var tabs = [
  //example tabs
  [
    ["<i class=\"fa-brands fa-github\"></i> Github"],
    ["https://github.com/udu3324/Typsnd"]
  ],
  [
    ["<i class=\"fa-brands fa-youtube\"></i> Youtube"],
    ["https://youtube.com"]
  ]
];

//filter variables
adminIPs = adminIPs.filter(n => n)
blacklistedIPs = blacklistedIPs.filter(n => n)
blacklistedUsernames = blacklistedUsernames.filter(n => n)
msgGreet = msgGreet.replace(/\n/g, "<br/>");

module.exports = {
  serverPort,
  adminIPs,
  adminIcon,
  altDetection,
  blacklistedIPs,
  blacklistedUsernames,
  msgGreet,
  msgCooldown,
  multipleRooms,
  tabs,
  htmlTitle
};
