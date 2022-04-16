// Elements
const $joinButton = document.querySelector("#join-button");
const $usernameInput = document.querySelector("#username");

// join button event
$joinButton.addEventListener("click", joinChat);
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
    // do login
    console.log("Username is " + $usernameInput.value);
    setCookie("username", $usernameInput.value, 9999999999);
    location.href = "/chat.html";
  }
}