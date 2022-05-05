var serverPort = 3000;



// Moderation Config



// IPs that have admin
var adminIPs = ["localhost"];

// Displayed on the left of admin users
var adminIcon = "<i class=\"fa-solid fa-shield\"></i> ";

// Blocks more than one connection from one client
var altDetection = true;

// IPs that are blocked connecting
var blacklistedIPs = [];

// Usernames that aren't allowed (not case sensitive)
var blacklistedUsernames = [];

// This is the cooldown when a user sends a message (from 0-9 seconds)
var msgCooldown = "2";



// Chat Addons/Functionality



// html title
var htmlTitle = "Typsnd";

// Greeting that user recieves on join
var msgGreet = "";

// This boolean toggles if multiple rooms are allowed
var multipleRooms = true;

// More tabs for the top right menu
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
adminIPs.filter(n => n)
blacklistedIPs.filter(n => n)
blacklistedUsernames.filter(n => n)

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
