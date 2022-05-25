/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const socket = io();

var isAnAdmin = false;

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
const $darkModeSwitch = document.querySelector("#dark-mode-switch");
const $usernameInput = document.querySelector("#username-input");
const $setUsernameButton = document.querySelector("#set-username-button");
const $refreshButton = document.querySelector("#refreshButton");

const $roomInput = document.querySelector("#room-input");
const $setRoomButton = document.querySelector("#set-room-button");

const $roomButton = document.querySelector("#roomButton");
const $roomOverlay = document.querySelector("#room-overlay");
const $roomBox = document.querySelector("#room-box");

const $toolToggleButton = document.querySelector("#toolToggleButton");
const $toolBarDiv = document.querySelector("#tools-bar");

const $messageButton = document.querySelector("#messageButton");
const $messageOverlay = document.querySelector("#message-overlay");
const $messageBox = document.querySelector("#message-box");

const $userMessageInput = document.querySelector("#user-message-input");
const $messageInput = document.querySelector("#message-input");
const $sendMessageButton = document.querySelector("#send-message-button");

const $messageBar = document.querySelector("#message-bar");

const $fromReplace = document.querySelector("#message-user-replace");
const $messageReplace = document.querySelector("#message-replace");

const $closeMessageButton = document.querySelector("#close-message");

const $joinDefaultButton = document.querySelector("#join-default-button");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// set username from cookies
const username = getCookie("username");

// set room from cookies
var room = getCookie("room");
if (room === "") {
  room = "Typsnd"
}

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

// socket server kick below
socket.on("kick", (usernameGiven) => {
  if (username === usernameGiven) {
    location.href = "/kick.html"
  }
});

socket.on("alt-kick", () => {
  location.href = "/alt-kick.html";
});

socket.on("blacklisted-ip-kick", () => {
  location.href = "/blacklisted-ip-kick.html";
});

socket.on("ban", (usernameGiven) => {
  if (username === usernameGiven) {
    location.href = "/ban.html"
  } else if (usernameGiven === "authenticatedFromSocketServer") {
    location.href = "/ban.html"
  }
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

  createMessageOptions($msg);
}

// display message when socket server sends
socket.on("message", message => {
  renderNewMessage(message)
});

// display image message when socket server sends
socket.on("image", message => {
  renderNewMessage(message)
});

var userStored;
function renderNewMessage(message) {
  var isMentioned = false
  var stored = $messages.lastElementChild.firstElementChild.innerHTML
  userStored = stored.substring(39, stored.indexOf("</span>"));

  //for mentioning
  if (message.text.includes(`@${username}`)) {
    console.log("mentioned!")

    var regex = new RegExp(`@${username}`, 'g' );
    var count = (message.text.match(regex) || []).length;

    console.log(count)

    var sizeOfMention = `@${username}`.length
    var startingIndex = 0
    //style the text
    for (let i = 0; i < count; i++) {
      //get where the mention is located
      var mentionIndex = message.text.indexOf(`@${username}`, startingIndex)

      //insert span 
      message.text = message.text.slice(0, mentionIndex) + "<span id=\"mention-text\">" + message.text.slice(mentionIndex);

      //update index
      mentionIndex = message.text.indexOf(`@${username}`, startingIndex)
      //insert /span 
      message.text = message.text.slice(0, mentionIndex+sizeOfMention) + "</span>" + message.text.slice(mentionIndex+sizeOfMention);

      startingIndex = mentionIndex+1
    }
    isMentioned = true
  }

  //if previous user messaged is same with new user message
  if (message.username === userStored) {
    //merge it with old one
    $messages.lastElementChild.lastElementChild.innerHTML += "<br/>" + message.text
  } else {
    //dont merge and create a new message
    const html = Mustache.render(messageTemplate, {
      username: message.username,
      message: message.text,
      createdAt: moment(message.createdAt).format("h:mm a")
    });

    $messages.insertAdjacentHTML("beforeend", html);
    messageNew();
  }

  //add css to mentioned message
  if (isMentioned) {
    $messages.lastElementChild.classList.add("mentioned-highliter");
  }

  autoscroll();
}

// When socket server sends roomData, update sidebar
socket.on("roomData", ({ room, users }) => {

  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });

  // set username placeholder
  $roomInput.placeholder = `${room}`;

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
var isHoldingDownCtrl = false;
function getEventTypeDown(key) {
  var keyCode = key.keyCode;

  //if key pressed is not control
  if (!(keyCode === 17) && !isHoldingDownCtrl) {
    if (!($messageFormInput === document.activeElement) && onSettingsBox && onEmojiBox && !roomUIIsToggled && !messageUIIsToggled) {
      console.log("Selected input automatically.");
      $messageFormInput.focus();
    }
  } else {
    console.log("holding ctrl")
    isHoldingDownCtrl = true;
  }
}
document.addEventListener('keydown', getEventTypeDown, false);

function getEventTypeUp(key) {
  var keyCode = key.keyCode;

  //if key pressed is not control
  if (!(keyCode === 17)) {
    isHoldingDownCtrl = false;
  }
}
document.addEventListener('keyup', getEventTypeUp, false);

function enableSendMSG() {
  $messageFormButton.removeAttribute("disabled");
  $messageFormButton.innerHTML = "<i class=\"fa-solid fa-paper-plane fa-lg\"></i>";

  $messageFormInput.focus();

  $imageSendButton.removeAttribute("disabled");
  $imageSendButton.innerHTML = "<i class=\"fa-solid fa-circle-plus fa-lg\"></i>";
  $insertEmojiButton.removeAttribute("disabled");
}

var timeLeft;
var pasteEnabled = true;
function cooldownMSGSend() {
  $messageFormButton.innerHTML = "<i class=\"fa-solid fa-" + timeLeft + " fa-lg\"></i>";
  $messageFormButton.setAttribute("disabled", "disabled");
  $imageSendButton.setAttribute("disabled", "disabled");
  $insertEmojiButton.setAttribute("disabled", "disabled");

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
  $insertEmojiButton.setAttribute("disabled", "disabled");
  $emojiBox.style.display = "none"
  boolClickedOn = false;

  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, error => {
    $messageFormInput.value = "";

    //catch user being undefined
    if (error == "Refresh the page!") {
      window.location.reload();
      return console.log(error);
    } else {
      console.log("Message delivered!");
      if (menuOpened) {
        toggleMenu(theMenuOpened, false)
      }
        
      timeLeft = messageCooldown;
      cooldownMSGSend();
    }
  });
});

var boolClickedOn = false;
// Message Send Stuff Above


// Settings Stuff Below
// set username placeholder
$usernameInput.placeholder = `${username}`;

// set username button event
$setUsernameButton.addEventListener("click", joinChat);
$usernameInput.addEventListener("keyup", function (event) {
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

// set room button event
$setRoomButton.addEventListener("click", joinDiffRoom);
$roomInput.addEventListener("keyup", function (event) {
  if (event.keyCode === 13) { //13 = enter
    event.preventDefault();
    joinDiffRoom()
  }
});

function joinDiffRoom() {
  if ($roomInput.value === "") {
    window.alert("You need a room! It can't be empty.");
  } else {
    // send msg alerting change of username
    var alertRoomChange = "I'm leaving this room to join another one. ";
    socket.emit("sendMessage", alertRoomChange, error => {
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
    console.log("Room is " + $roomInput.value);
    setCookie("room", $roomInput.value, 9999999999);
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
}
function setDarkmode() {
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
          console.log("Message delivered!");

          timeLeft = messageCooldown;
          cooldownMSGSend();
        }
      });
    }
    reader.readAsDataURL(file);
  }
}
// Image Upload Stuff Above

// Image select and view stuff below
// tysm <3 https://stackoverflow.com/a/54466127/14677066
$('body').on('click', 'img', function () {
  const base64ImageData = $(this).attr('src');

  const contentType = base64ImageData.substring(5, base64ImageData.indexOf(";"));

  const byteCharacters = atob(base64ImageData.substr(`data:${contentType};base64,`.length));
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, { type: contentType });
  const blobUrl = URL.createObjectURL(blob);

  window.open(blobUrl, '_blank');
})
// image select and view stuff above

// tools bar below

$toolToggleButton.addEventListener("click", toggleToolBar);

function disableToolButtons(bool) {
  if (bool)
      $toolBarDiv.style.top = "-50px"
    else
      $toolBarDiv.style.top = "0px";
}

var toolBarToggled = false
function toggleToolBar() {
  if (toolBarToggled) {
    $toolBarDiv.style.opacity = "0.0";
    $toolToggleButton.innerHTML = "<i class=\"fa-solid fa-angle-down\"></i>"
    disableToolButtons(true)
    toolBarToggled = false
  } else {
    $toolBarDiv.style.opacity = "1.0";
    $toolToggleButton.innerHTML = "<i class=\"fa-solid fa-angle-up\"></i>"
    disableToolButtons(false)
    toolBarToggled = true
  }
}

//room change stuff below
$roomButton.addEventListener("click", roomUIToggle);

var roomUIIsToggled = false
function roomUIToggle() {
  if (roomUIIsToggled) {
    $roomOverlay.style.display = "none"
    roomUIIsToggled = false
  } else {
    $roomOverlay.style.display = "flex"
    roomUIIsToggled = true
  }
}

var onRoomBox = true;
// settings box
$roomBox.onmouseover = function () {
  onRoomBox = false
}
$roomBox.onmouseout = function () {
  onRoomBox = true
}

// settings overlay
$roomOverlay.addEventListener("click", function () {
  if (onRoomBox) {
    console.log("Room overlay has been clicked off of.");
    roomUIToggle()
  }
});


function addATab(name, url) {
  // create the anchor element with the href attribute
  const a = document.createElement('button');
  a.setAttribute('onclick', "window.open('" + url + "','_blank');");
  a.innerHTML = name;
  a.className = "toolButton"

  // add the <a> element tree into the div#something
  $toolBarDiv.appendChild(a);
}

socket.on("tabs", (tabs) => {

  //for each tab in array, create one
  for (let index = 0; index < tabs.length; ++index) {
    addATab(tabs[index][0], tabs[index][1])
  }

  disableToolButtons(true)
});

//message user stuff below
$messageButton.addEventListener("click", messageUIToggle);

var messageUIIsToggled = false
function messageUIToggle() {
  if (messageUIIsToggled) {
    $messageOverlay.style.display = "none"
    messageUIIsToggled = false
  } else {
    $messageOverlay.style.display = "flex"
    messageUIIsToggled = true
  }
}

var onMessageBox = true;
// message box
$messageBox.onmouseover = function () {
  onMessageBox = false
}
$messageBox.onmouseout = function () {
  onMessageBox = true
}

// message overlay
$messageOverlay.addEventListener("click", function () {
  if (onMessageBox) {
    console.log("Message overlay has been clicked off of.");
    messageUIToggle()
  }
});

$sendMessageButton.onclick = function () {
  var user = $userMessageInput.value
  var message = $messageInput.value

  //make sure all inputs are provided
  if (user === "") {
    alert("No user provided!")
    return;
  }
  if (message === "") {
    alert("No message provided!")
    return;
  }

  var packet = [user, message]

  //send it
  socket.emit("sendDirectMessage", packet, error => {
    $messageInput.value = "";

    //catch errors
    if (error === "User does not exist!") {

      alertAsync("User specified does not exist!")
      $userMessageInput.value = "";

      return console.log(error);
    } else if (error === "Message is over 280!") {

      alertAsync("Message is over 280 characters long!")
      $userMessageInput.value = "";

      return console.log(error);
    } else {

      alertAsync("Message has been sucessfully sent!")

      console.log("Message delivered!");
    }
  });
};

var userHashed = username

// thank you <3 https://stackoverflow.com/a/3890175/14677066
function linkify(inputText) {
  var replacedText, replacePattern1, replacePattern2, replacePattern3;

  //URLs starting with http://, https://, or ftp://
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

  //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
  replacePattern2 = /(^|[^/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

  //Change email addresses to mailto:: links.
  replacePattern3 = /(([a-zA-Z0-9\-_.])+@[a-zA-Z_]+?(\.[a-zA-Z]{2,6})+)/gim;
  replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

  return replacedText;
}

//recieve direct messages sent
socket.on("recieveDirectMessage" + userHashed, (packetOut) => {
  //alert(packetOut[0] + "\n" + packetOut[1])

  //make links
  packetOut[1] = linkify(packetOut[1])

  $fromReplace.innerHTML = packetOut[0]
  $messageReplace.innerHTML = packetOut[1]

  $messageBar.style.display = "block"
});

$closeMessageButton.onclick = function () {
  $messageBar.style.display = "none"

  $fromReplace.innerHTML = ""
  $messageReplace.innerHTML = ""
}

// Make the DIV element draggable:
dragElement($messageBar);

//tysm w3schools <3 https://www.w3schools.com/howto/howto_js_draggable.asp
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    if ($("#from:hover").length != 0) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    var int1 = elmnt.offsetTop - pos2
    if (int1 > 0 && int1 < ($(window).height() - 30)) {
      elmnt.style.top = int1 + "px";
    }

    var int2 = elmnt.offsetLeft - pos1
    if (int2 > 0 && int2 < ($(window).width() - 30)) {
      elmnt.style.left = int2 + "px";
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

//recieve direct messages sent
socket.on("html-title", htmlTitleSent => {
  document.title = htmlTitleSent;
});

$joinDefaultButton.onclick = function () {
  var currentRoom = getCookie("room");

  //check if room is not default
  if (currentRoom != "Typsnd") {
    $roomInput.value = "Typsnd"
    joinDiffRoom()
  } else {
    alertAsync("You're already in the default room!")
  }
}
