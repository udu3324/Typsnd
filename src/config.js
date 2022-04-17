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

// This determines if IPs should be publicly be shown in chat
// It still will be shown if a user is admin
var showIPsInChat = false;

// This is the greeting message of the new user
// Use <br> to create another line
var msgGreet = "";

// This is the cooldown when a user sends a message
// Cooldown can be from 0s to 9s
var msgCooldown = "2";

// This is the icon that will be on the right of admin usernames.
var adminIcon = "<i class=\"fa-solid fa-shield\"></i> ";

// This boolean toggles if multiple rooms are allowed
var multipleRooms = true;

module.exports = {
  serverPort,
  adminIPs,
  blacklistedIPs,
  blacklistedUsernames,
  showIPsInChat,
  msgGreet,
  msgCooldown,
  adminIcon,
  multipleRooms
};
