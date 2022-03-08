const socket = io();

// CSS
var cssVar = document.querySelector(':root');
cssVar.style.setProperty('--accent', getCookie("accent"));

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $messages = document.querySelector("#messages");
const $imageSendButton = document.querySelector("#sendImageButton");
const $insertEmojiButton = document.querySelector("#insertEmojiButton");
const $emojiBox = document.querySelector("emoji-picker");
const $imagesSentInChat = document.querySelector("img#uploaded-image");
const $scrollDownButton = document.querySelector("#scrollDownMSG");
const $user = document.querySelector("#user-replace");
const $disconnectOverlay = document.querySelector("#disconnect-overlay");
const $adminStatus = document.querySelector("#admin-status");
const $adminPanel = document.querySelector("#admin-panel");
const $settingsButton = document.querySelector("#settingsButton");
const $settingsOverlay = document.querySelector("#settings-overlay");
const $settingsBox = document.querySelector("#settings-box");
const $accentColorPicker = document.querySelector("#accent-color-picker");
const $githubButton = document.querySelector("#github-button");
const $cooldownSetButton = document.querySelector("#set-cooldown-button");
const $cooldownInput = document.querySelector("#cooldown-input");
const $darkModeSwitch = document.querySelector("#dark-mode-switch");
const $usernameInput = document.querySelector("#username-input");
const $setUsernameButton = document.querySelector("#set-username-button");
const $kickUserInput = document.querySelector("#kick-user-input");
const $kickUserButton = document.querySelector("#kick-user-button");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

// Set Cookies and Get Cookies
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

// set username from cookies
const username = getCookie("username");

//set username on bottom left corner
$user.innerHTML = username;

let onSettingsBox = true;

// autoscroll div down when user is looking at latest msgs
const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $('#messages').animate({
      scrollTop: $messages.scrollHeight - $messages.clientHeight
    }, 125);
    $scrollDownButton.style.visibility = "hidden";
  } else {
    $scrollDownButton.style.visibility = "visible";
  }
};

// check if div has scrolled down to remove scrollDownButton
$(document).ready(function () {
  $('#messages').on('scroll', chk_scroll);
});
function chk_scroll(e) {
  var elem = $(e.currentTarget);
  if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()) {
    $scrollDownButton.style.visibility = "hidden";
  }
}

// scroll down button below
$scrollDownButton.addEventListener("click", function () {
  console.log("Scroll down button has been clicked on.");
  $('#messages').animate({
    scrollTop: $messages.scrollHeight - $messages.clientHeight
  }, 300);
  $scrollDownButton.style.visibility = "hidden";
});

// show disconnect div when lost connection to socketio
socket.on('disconnect', function () {
  console.log("Disconnected from client!")
  $settingsOverlay.style.display = "none";
  $emojiBox.style.display = "none";
  $disconnectOverlay.style.display = "flex";

  $(':button').prop('disabled', true);
});

// socket server kick below
socket.on("kick", (usernameGiven) => {
  if (username === usernameGiven) {
    console.log("kicked.")
    
    location.href = "/kick.html"
  } 
});

socket.on("alt-kick", () => {
  location.href = "/alt-kick.html";
});

socket.on("blacklisted-ip-kick", () => {
  location.href = "/blacklisted-ip-kick.html";
});

// Set message cooldown input
var messageCooldown;
socket.on("message-cooldown", msgCooldown => {
  messageCooldown = msgCooldown;
  $cooldownInput.value = `${messageCooldown}`;
});

// message animate opacity
function messageNew() {
  var $msg = $messages.lastElementChild;
  var messageOpacity = 0;
  function messageAnimate() {
    $msg.style.opacity = messageOpacity;

    if (messageOpacity < 1) {
      setTimeout(messageAnimate, 5)
      messageOpacity = messageOpacity + 0.01;
    }
  }
  messageAnimate();
}
// display message when socket server sends
socket.on("message", message => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();

  messageNew();
});

// display image message when socket server sends
socket.on("image", message => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();

  messageNew();
});

// When socket server sends roomData, update sidebar
socket.on("roomData", ({ room, users }) => {

  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });

  document.querySelector("#sidebar").innerHTML = html;
});

// Emit join to socket server to join the chat
socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});


// Message Send Stuff Below
// Autoselect message send input when key is pressed
function getEventType() {
  if (!($messageFormInput === document.activeElement) && onSettingsBox && onEmojiBox) {
    console.log("Selected input automatically.");
    $messageFormInput.focus();
  }
}
document.addEventListener('keydown', getEventType, false);

function enableSendMSG() {
  $messageFormButton.removeAttribute("disabled");
  $messageFormButton.innerHTML = "<i class=\"fa-solid fa-paper-plane fa-lg\"></i>";

  $messageFormInput.focus();

  $imageSendButton.removeAttribute("disabled");
  $imageSendButton.innerHTML = "<i class=\"fa-solid fa-image fa-lg\"></i>";
}

var timeLeft;
var pasteEnabled = true;
function cooldownMSGSend() {
  $messageFormButton.innerHTML = "<i class=\"fa-solid fa-" + timeLeft + " fa-lg\"></i>";

  if (timeLeft > 0) {
    setTimeout(cooldownMSGSend, 1000)
    timeLeft--;
  } else {
    enableSendMSG();
    pasteEnabled = true;
  }
}

$messageForm.addEventListener("submit", e => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");
  $imageSendButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, error => {
    $messageFormInput.value = "";

    //catch user being undefined
    if (error == "Refresh the page!") {
      window.location.reload();
      return console.log(error);
    } else {
      console.log("Message delivered!");

      timeLeft = messageCooldown;
      cooldownMSGSend();
    }
  });
});

var boolClickedOn = false;
// Insert Emoji
$insertEmojiButton.addEventListener("click", function () {
  console.log("Insert Emoji button has been clicked on.");
  if (boolClickedOn) {
    $emojiBox.style.display = "none"
    boolClickedOn = false;
  } else {
    $emojiBox.style.display = "flex"
    boolClickedOn = true;
  }
});

var onEmojiBox = false;
// emoji box
$emojiBox.onmouseover = function () {
  onEmojiBox = false
  $messageFormInput.blur()
}
$emojiBox.onmouseout = function () {
  onEmojiBox = true
  $messageFormInput.focus()
}

// On Emoji Click
$emojiBox.addEventListener('emoji-click', event => sendEmoji(event.detail));
function sendEmoji(detail) {
  $messageFormInput.value = $messageFormInput.value + detail.unicode;
}
// Message Send Stuff Above


// Settings Stuff Below
// set username placeholder
$usernameInput.placeholder = `${username}`;

// set username button event
$setUsernameButton.addEventListener("click", joinChat);
$usernameInput.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) { //13 = enter
    event.preventDefault();
    joinChat()
  }
});

function joinChat() {
  if ($usernameInput.value === "") {
    window.alert("You need a username! It can't be empty.");
  } else {
    // send msg alerting change of username
    var alertUsernameChange = "I'm changing my username from \"" + username + "\" to \"" + $usernameInput.value + "\".";
    socket.emit("sendMessage", alertUsernameChange, error => {
      $messageFormInput.value = "";

      //catch user being undefined
      if (error == "Refresh the page!") {
        window.location.reload();
        return console.log(error);
      } else {
        console.log("Message delivered!");

        timeLeft = messageCooldown;
        cooldownMSGSend();
      }
    });

    // do login
    console.log("Username is " + $usernameInput.value);
    setCookie("username", $usernameInput.value, 9999999999);
    location.href = "/chat.html";
  }
}

// dark mode stuff
if (getCookie("dark-mode") == "") {
  setCookie("dark-mode", "true", 9999999999);
} else if (getCookie("dark-mode") == "false") {
  setLightmode();
  $darkModeSwitch.checked = true;
}
function setLightmode() {
  if (adminPanelStyle) {
    $adminStatus.style.backgroundColor = '#c3c3c3';
  }
  console.log("Dark mode has been turned off.")
  cssVar.style.setProperty('--messageDiv', "#f7f7f7");
  cssVar.style.setProperty('--messages', "#ffffff");
  cssVar.style.setProperty('--compose', "#f5f5f5");
  cssVar.style.setProperty('--userSidebar', "#d1d1d1");
  cssVar.style.setProperty('--sidebar', "#ebebeb");
  cssVar.style.setProperty('--roomTitle', "#d9d9d9");
  cssVar.style.setProperty('--fontColor', "#000000");
  cssVar.style.setProperty('--scrollbarTrack', "#cbcbcb");
  cssVar.style.setProperty('--scrollbarThumb', "#ababab");
  cssVar.style.setProperty('--composeInput', "#dfdfdf");
  $emojiBox.setAttribute("class", "light");
  $emojiBox.style.boxShadow = "0px 0px 17px 1px rgb(0 0 0 / 0%)"
  $settingsButton.style.boxShadow = "none"
  $messageFormInput.style.boxShadow = "none"
  $imageSendButton.style.boxShadow = "none"
  $insertEmojiButton.style.boxShadow = "none"
  $messageFormButton.style.boxShadow = "none"


}
function setDarkmode() {
  if (adminPanelStyle) {
    $adminStatus.style.backgroundColor = '#313338';
  }
  console.log("Dark mode has been turned on.")
  cssVar.style.setProperty('--messageDiv', "#36393f");
  cssVar.style.setProperty('--messages', "#313338");
  cssVar.style.setProperty('--compose', "#40444b");
  cssVar.style.setProperty('--userSidebar', "#1d1f22");
  cssVar.style.setProperty('--sidebar', "#202225");
  cssVar.style.setProperty('--roomTitle', "#2c2f3a");
  cssVar.style.setProperty('--fontColor', "#ffffff");
  cssVar.style.setProperty('--scrollbarTrack', "#2E3338");
  cssVar.style.setProperty('--scrollbarThumb', "#202225");
  cssVar.style.setProperty('--composeInput', "#40444b");
  $emojiBox.setAttribute("class", "dark");
  $emojiBox.style.boxShadow = "0px 0px 17px 1px rgb(0 0 0 / 50%)"
  $settingsButton.style.boxShadow = "0px 0px 17px 1px rgb(0 0 0 / 50%)"
  $messageFormInput.style.boxShadow = "0px 0px 17px 1px rgb(0 0 0 / 50%)"
  $imageSendButton.style.boxShadow = "0px 0px 17px 1px rgb(0 0 0 / 50%)"
  $insertEmojiButton.style.boxShadow = "0px 0px 17px 1px rgb(0 0 0 / 50%)"
  $messageFormButton.style.boxShadow = "0px 0px 17px 1px rgb(0 0 0 / 50%)"
}
var adminPanelStyle;
function checkIt() {
  if ($darkModeSwitch.checked) {
    setLightmode();
    setCookie("dark-mode", "false", 9999999999);
  } else {
    setDarkmode();
    setCookie("dark-mode", "true", 9999999999);
  }
}
$darkModeSwitch.addEventListener('change', checkIt, false);

// send socket to set cooldown
$cooldownSetButton.addEventListener("click", function () {
  var setCooldownTo = $cooldownInput.value;
  console.log("Cooldown button has been clicked on with a set value of " + setCooldownTo);
  socket.emit("setCooldown", setCooldownTo, error => {
    if (error) {
      alert(error);
      location.href = "/";
    }
  });
});

// github button send to
$githubButton.addEventListener("click", function () {
  window.open("https://github.com/udu3324/Typsnd");
});

//set admin status and reveal admin panel
socket.on("admin-status", isAdmin => {
  if (isAdmin) {
    adminPanelStyle = true;
    $adminStatus.innerHTML = "<i class=\"fa-solid fa-lock-open\"></i> You're Admin! " +
      "Anything set below wont be saved. Use config.js instead to make it permanent.";

    $adminStatus.style.backgroundColor = '#313338';
    $adminStatus.style.borderRadius = '4px 4px 0px 0px';
    $adminStatus.style.paddingTop = '4px';
    $adminStatus.style.paddingLeft = '4px';
    $adminStatus.style.paddingRight = '4px';
    $adminPanel.style.display = "flex";
  } else {
    adminPanelStyle = false;
    $adminStatus.innerHTML = "<i class=\"fa-solid fa-lock\"></i> You aren't Admin! Sadly you cant do much stuff here.";
  }
});

// change accent color
$accentColorPicker.addEventListener("input", updateFirst, false);
function updateFirst(event) {
  cssVar.style.setProperty('--accent', event.target.value);
  setCookie("accent", event.target.value, 9999999999);
}

if (getCookie("accent") == "") {
  $accentColorPicker.value = "#8FBC8F";
} else {
  $accentColorPicker.value = getCookie("accent");
}

var opacityInt;
function opacityUp() {
  $settingsOverlay.style.opacity = opacityInt;

  if (opacityInt < 1) {
    setTimeout(opacityUp, 3)
    opacityInt = opacityInt + 0.01;
  } else {
    $settingsOverlay.style.pointerEvents = "auto";
  }
}
var opacityIntTwo;
function opacityDown() {
  $settingsOverlay.style.opacity = opacityIntTwo;

  if (opacityIntTwo > 0) {
    setTimeout(opacityDown, 3)
    opacityIntTwo = opacityIntTwo - 0.01;
  } else {
    $settingsOverlay.style.display = "none";
    $settingsOverlay.style.pointerEvents = "auto";
  }
}
$settingsButton.addEventListener("click", function () {
  console.log("Settings button has been clicked on.");
  $settingsOverlay.style.display = "flex";
  $settingsOverlay.style.pointerEvents = "none";
  $settingsButton.disabled = true;
  opacityInt = 0;
  opacityUp();
});

// settings box
$settingsBox.onmouseover = function () {
  onSettingsBox = false
}
$settingsBox.onmouseout = function () {
  onSettingsBox = true
}

// settings overlay
$settingsOverlay.addEventListener("click", function () {
  if (onSettingsBox) {
    console.log("Settings overlay has been clicked off of.");
    $settingsOverlay.style.pointerEvents = "none";
    $settingsButton.disabled = false;
    opacityIntTwo = 1;
    opacityDown();
  }
});


// kick user stuff
$kickUserButton.addEventListener("click", kickUser);
$kickUserInput.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) { //13 = enter
    event.preventDefault();
    kickUser()
  }
});
function kickUser() {
  if ($kickUserInput.value === "") {
    window.alert("You need a username! It can't be empty.");
  } else {
    // send msg alerting change of username
    var kickingUsername = $kickUserInput.value
    socket.emit("kickUser", kickingUsername, error => {
      //catch user being undefined
      if (error == "Refresh the page!") {
        window.location.reload();
        return console.log(error);
      } else {
        console.log("Kicked user successfuly.");
      }
    });
    $kickUserInput.value = "";
  }
}
// Settings Stuff Above


// Image Upload Stuff Below
$imageSendButton.addEventListener("click", function () {
  console.log("File Upload button has been clicked on.");
  openFileDialog();
});

function openFileDialog(callback) {  // this function must be called from  a user
  // activation event (ie an onclick event)

  // Create an input element
  const inputElement = document.createElement("input");

  // Set its type to file
  inputElement.type = "file";

  // Set accept to the file types you want the user to select. 
  // Include both the file extension and the mime type
  inputElement.accept = "image/png, image/jpeg, image/gif, image/apng, image/svg, image/bmp, image/ico";

  // set onchange event to call callback when user has selected file
  inputElement.addEventListener("change", handleFiles, callback)

  // dispatch a click event to open the file dialog
  inputElement.dispatchEvent(new MouseEvent("click"));
}

function handleFiles() {
  console.log("file has been submitted and now being handled.")
  const fileList = this.files; /* now you can work with the file list */
  for (let i = 0, numFiles = fileList.length; i < numFiles; i++) {
    const file = fileList[i];
    var reader = new FileReader()
    reader.onload = function (base64) {

      console.log(base64.target.result);

      //emit new message
      socket.emit("sendImage", base64.target.result, error => {
        if (error == "Refresh the page!") {
          window.location.reload();
          return console.log(error);
        } else {
          $messageFormButton.setAttribute("disabled", "disabled");
          $imageSendButton.setAttribute("disabled", "disabled");

          console.log("Message delivered!");

          timeLeft = messageCooldown;
          cooldownMSGSend();
        }
      });
    }
    reader.readAsDataURL(file);
  }
}
document.onpaste = function (event) {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    console.log(JSON.stringify(items)); // might give you mime types
    for (var index in items) {
        var item = items[index];
        if (item.kind === 'file') {
            var blob = item.getAsFile();
            var reader = new FileReader();
            reader.onload = function (event) {
              //emit new message

              if (pasteEnabled) {
                pasteEnabled = false;
                socket.emit("sendImage", event.target.result, error => {
                if (error == "Refresh the page!") {
                  window.location.reload();
                  return console.log(error);
                } else {
                  $messageFormButton.setAttribute("disabled", "disabled");
                  $imageSendButton.setAttribute("disabled", "disabled");
                  
                  console.log("Message delivered!");
                
                  timeLeft = messageCooldown;
                  cooldownMSGSend();
                }
              });
            }
          }; 
          reader.readAsDataURL(blob);
        }
    }
};
// Image Upload Stuff Above

// Image select and view stuff below
$('body').on('click', 'img', function () {
  var imgSrc = $(this).attr('src');

  var image = new Image();
  image.src = imgSrc;

  var w = window.open("");
  w.document.write(image.outerHTML);
  w.document.write('<body bgcolor="#36393f">')
})
// image select and view stuff above