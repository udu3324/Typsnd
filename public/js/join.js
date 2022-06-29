// Elements
var $joinButton = document.querySelector("#join-button");
var $usernameInput = document.querySelector("#username");
var cssVar = document.querySelector(':root');

// join button event
$joinButton.addEventListener("click", joinChat);
$usernameInput.addEventListener("keyup", function (event) {
  if (event.keyCode === 13) { //13 = enter
    event.preventDefault();
    joinChat()
  }
});

function joinChat() {
  if ($usernameInput.value === "")
    return alertAsync("You need a username! It can't be empty.");

  // do login
  setCookie("username", $usernameInput.value, 9999999999);

  if (getCookie("room") === "")
    setCookie("room", "Typsnd", 9999999999);
 
  location.href = "/chat.html";
}

//autoselect input
$usernameInput.focus();
$usernameInput.select();

//set username if saved
if (getCookie("username") != "") {
  $usernameInput.value = getCookie("username")
}

//previous room indicator
if (getCookie("room") != "" && getCookie("room") != "Typsnd") {
  const para = document.createElement("p");
  const node = document.createTextNode(`Your previous room was \"${getCookie("room")}\"`);
  para.style.cssText += 'color:#8fbc8f;padding-top:13px'
  para.appendChild(node);
  document.getElementById("centered-form__box").appendChild(para);
}

document.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    joinChat()
  }
});

//set accent and light mode
if (getCookie("accent") != "")
  cssVar.style.setProperty('--accent', getCookie("accent"));

if (getCookie("dark-mode") === "false") {
  cssVar.style.setProperty('--messageDiv', "#f7f7f7");
  cssVar.style.setProperty('--fontColor', "#000000");
  cssVar.style.setProperty('--composeInput', "#dfdfdf");
}