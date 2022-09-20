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

//filter variables
adminIPs = adminIPs.filter(n => n)
blacklistedIPs = blacklistedIPs.filter(n => n)
blacklistedUsernames = blacklistedUsernames.filter(n => n)
msgGreet = msgGreet.replace(/\n/g, "<br/>");
adminIcon += " " //important
botIcon += " " //important
if (msgGreet.length >= 1)
  msgGreet = "<br/>" + msgGreet

//func to override "TypeError: Assignment to constant variable."
export function setMsgCooldown(i) {
  msgCooldown = i
}

export function setblacklistedUsernames(arr) {
  blacklistedUsernames = arr
}