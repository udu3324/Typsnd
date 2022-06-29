const $cooldownSetButton = document.querySelector("#set-cooldown-button");
const $cooldownInput = document.querySelector("#cooldown-input");
const $cooldownUpButton = document.querySelector("#cooldown-up-button");
const $cooldownDownButton = document.querySelector("#cooldown-down-button");
const $kickUserInput = document.querySelector("#kick-user-input");
const $kickUserButton = document.querySelector("#kick-user-button");
const $banUserInput = document.querySelector("#ban-user-input");
const $banUserButton = document.querySelector("#ban-user-button");
const $unbanUserInput = document.querySelector("#unban-user-input");
const $unbanUserButton = document.querySelector("#unban-user-button");
const $alertMessageInput = document.querySelector("#alert-message-input");
const $sendAlertButton = document.querySelector("#send-alert-button");

var isAnAdmin = false;

socket.on("message-cooldown", msgCooldown => {
  messageCooldown = msgCooldown;
  $cooldownInput.value = `${messageCooldown}`;
});

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
  if (username === usernameGiven || usernameGiven === "authenticatedFromSocketServer")
    location.href = "/ban.html"
});

socket.on("alert", (message) => {
  $alertOverlay.firstElementChild.innerHTML = message
  $alertOverlay.style.top = "0px"
});

$cooldownUpButton.addEventListener("click", function () {
  if (messageCooldown != 9) {
    messageCooldown++;
    $cooldownInput.value = `${messageCooldown}`;
  }
});

$cooldownDownButton.addEventListener("click", function () {
  if (messageCooldown != 0) {
    messageCooldown--;
    $cooldownInput.value = `${messageCooldown}`;
  }
});

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

$kickUserButton.addEventListener("click", kickUser);
$kickUserInput.addEventListener("keyup", function (event) {
  if (event.keyCode === 13) { //13 = enter
    event.preventDefault();
    kickUser()
  }
});
function kickUser() {
  if ($kickUserInput.value === "")
    return alertAsync("You need a username! It can't be empty.");

  // send msg alerting change of username
  var kickingUsername = $kickUserInput.value
  socket.emit("kickUser", kickingUsername, error => {
    if (error === "bad")
      return window.location.reload();
    if (error === "notExistingUser")
      return alertAsync("The user you tried to kick doesn't exist!")
    if (error === "isAdmin")
      return alertAsync("The user you tried to kick is a admin!")

    alertAsync("Sucessfully kicked the user.")
    console.log("Kicked user successfuly.");
  });
  $kickUserInput.value = "";
}

$banUserButton.addEventListener("click", banUser);
$banUserInput.addEventListener("keyup", function (event) {
  if (event.keyCode === 13) { //13 = enter
    event.preventDefault();
    banUser()
  }
});
function banUser() {
  if ($banUserInput.value === "")
    return alertAsync("You need a username! It can't be empty.");

  socket.emit("banUser", $banUserInput.value, error => {
    if (error === "bad")
      return window.location.reload();
    if (error === "notExistingUser")
      return alertAsync("The user you tried to ban doesn't exist!")
    if (error === "isAdmin")
      return alertAsync("The user you tried to ban is a admin!")

    alertAsync("Sucessfully banned the user.")
    console.log("Banned user successfuly.");
  });
  $banUserInput.value = "";
}

$unbanUserButton.addEventListener("click", unbanUser);
$unbanUserInput.addEventListener("keyup", function (event) {
  if (event.keyCode === 13) { //13 = enter
    event.preventDefault();
    unbanUser()
  }
});
function unbanUser() {
  if ($unbanUserInput.value === "")
    return alertAsync("You need a username! It can't be empty.");

  socket.emit("unbanUser", $unbanUserInput.value, error => {
    if (error === "bad")
      return window.location.reload();
    if (error.includes("User provided was invalid."))
      return alertAsync(error)

    alertAsync("Sucessfully unbanned the user.")
    console.log("Unbanned user successfuly.");
    console.log(error[0]);
  });
  $unbanUserInput.value = "";
}

$sendAlertButton.addEventListener("click", sendAlert)
$alertMessageInput.addEventListener("keyup", function (event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    sendAlert()
  }
})
function sendAlert() {
  if ($alertMessageInput.value === "")
    return alertAsync("You need a message! It can't be empty!")

  var alert = $alertMessageInput.value

  socket.emit("alert", alert, error => {
    if (error === "bad")
      return window.location.reload();
    if (error === "short")
      return alertAsync("The message alert you provided is too short.")
    if (error === "long")
      return alertAsync("The message alert you provided is too long.")

    alertAsync("Sucessfully sent a alert to everyone.")
    console.log("Sent alert successfuly.");
    $alertMessageInput.value = "";
  });
}

//set admin status and reveal admin panel
socket.on("admin-status", isAdmin => {
  if (!isAdmin[0]) {
    adminPanelStyle = false;
    $adminStatus.innerHTML = "<i class=\"fa-solid fa-lock\"></i> You aren't a Admin!";
    return;
  }
  isAnAdmin = true;
  adminPanelStyle = true;
  userHashed = isAdmin[1] + username

  $adminStatus.innerHTML = "<i class=\"fa-solid fa-lock-open\"></i> You are a Admin!";
  $adminStatus.style.backgroundColor = 'var(--messages)';
  $adminStatus.style.borderRadius = '4px 4px 0px 0px';
  $adminStatus.style.paddingTop = '4px';
  $adminStatus.style.paddingLeft = '4px';
  $adminStatus.style.paddingRight = '4px';
  $adminPanel.style.display = "flex";
});