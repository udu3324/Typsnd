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
const $user = document.querySelector("#user-replace");
const $adminStatus = document.querySelector("#admin-status");
const $adminPanel = document.querySelector("#admin-panel");
const $settingsButton = document.querySelector("#settingsButton");
const $settingsOverlay = document.querySelector("#settings-overlay");
const $settingsBox = document.querySelector("#settings-box");
const $accentColorPicker = document.querySelector("#accent-color-picker");
const $githubButton = document.querySelector("#github-button");
const $cooldownSetButton = document.querySelector("#set-cooldown-button");
const $cooldownInput = document.querySelector("#cooldown-input");
const $disconnectOverlay = document.querySelector("#disconnect-overlay");
const $darkModeSwitch = document.querySelector("#dark-mode-switch");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

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

//set username on bottom left corner
$user.innerHTML = username;

let onSettingsBox = true;

// refresh when lost connection to socket server
socket.on('disconnect', function () {
  console.log("Disconnected from client!")
  $settingsOverlay.style.display = "none";
  $disconnectOverlay.style.display = "flex";
});

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
    $newMessage.scrollIntoView();
  }
};


// socket server kick below
socket.on("alt-kick", () => {
  location.href = "/alt-kick.html";
});

socket.on("blacklisted-ip-kick", () => {
  location.href = "/blacklisted-ip-kick.html";
});
// socket server kick above

// Set message cooldown input
var messageCooldown;
socket.on("message-cooldown", msgCooldown => {
  messageCooldown = msgCooldown;
  $cooldownInput.value = `${messageCooldown}`;
});

// display message when socket server sends
socket.on("message", message => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
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
  if (!($messageFormInput === document.activeElement) && onSettingsBox) {
    console.log("Selected input automatically.");
    $messageFormInput.focus();
  }
}
document.addEventListener('keydown', getEventType, false);

function enableSendMSG() {
  $messageFormButton.removeAttribute("disabled");
  $messageFormButton.innerHTML = "<i class=\"fa-solid fa-paper-plane fa-lg\"></i>";
  $messageFormInput.focus();
};

var timeLeft;
function cooldownMSGSend() {
  $messageFormButton.innerHTML = "<i class=\"fa-solid fa-" + timeLeft + " fa-lg\"></i>";

  if (timeLeft > 0) {
    setTimeout(cooldownMSGSend, 1000)
    timeLeft--;
  } else {
    enableSendMSG();
  }
}

$messageForm.addEventListener("submit", e => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

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
// Message Send Stuff Above


// Settings Stuff Below
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
  cssVar.style.setProperty('--messageDiv', "#f5f5f5");
  cssVar.style.setProperty('--messages', "#c3c3c3");
  cssVar.style.setProperty('--compose', "#ffffff");
  cssVar.style.setProperty('--userSidebar', "#959595");
  cssVar.style.setProperty('--sidebar', "#a7a7a7");
  cssVar.style.setProperty('--roomTitle', "#7e7e7e");
  cssVar.style.setProperty('--fontColor', "#000000");
  cssVar.style.setProperty('--scrollbarTrack', "#cbcbcb");
  cssVar.style.setProperty('--scrollbarThumb', "#ababab");
  cssVar.style.setProperty('--composeInput', "#cbcbcb");
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

$settingsButton.addEventListener("click", function () {
  console.log("Settings button has been clicked on.");
  $settingsOverlay.style.display = "flex";
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
    $settingsOverlay.style.display = "none";
  }
});
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
      var message = "<img id=\"uploaded-image\" alt=\"image\"  src=\"" + base64.target.result + "\">"

      console.log(message);

      //emit new message
      socket.emit("sendImage", message, error => {

        if (error == "Refresh the page!") {
          window.location.reload();
          return console.log(error);
        } else {
          console.log("Message delivered!");
        }
      });
    }
    reader.readAsDataURL(file);
  }
}
// Image Upload Stuff Above