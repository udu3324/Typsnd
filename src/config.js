// Please do not leave arry variables empty like [""]
// This can cause errors and break some functionality

// This won't break Typsnd:
// var example = ["localhost"];
// var example = [];

// This will break Typsnd:
// var example = [""];
// var example = ["10.0.3.45", ""];

// This is the port Typsnd will run on
var serverPort = "3000";

// The IPs below will recieve admin privlages
var adminIPs = ["localhost"];

// The IPs below wont be able to join the chat
var blacklistedIPs = [];

// The usernames below wont be able to be used unless if they're an admin
var blacklistedUsernames = [];

// This is the greeting message of the new user
// Use <br> to create another line
var msgGreet = "";

// This is the cooldown when a user sends a message
// Cooldown can be from 0s to 9s
var msgCooldown = "2";

// This boolean toggles if multiple rooms are allowed
var multipleRooms = true;

// This array contains the links for tabs
var tabs = [
  //example tab
  //string 1 is what the button will say
  //string 2 is what the button will link to
  [
    ["<i class=\"fa-brands fa-github\"></i> Github"],
    ["https://github.com/udu3324/Typsnd"]
  ],
  [
    ["<i class=\"fa-brands fa-youtube\"></i> Youtube"],
    ["https://youtube.com"]
  ]
];

module.exports = {
  serverPort,
  adminIPs,
  blacklistedIPs,
  blacklistedUsernames,
  msgGreet,
  msgCooldown,
  multipleRooms,
  tabs
};
