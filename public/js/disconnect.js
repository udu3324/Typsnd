// show disconnect div when lost connection to socketio
socket.on('disconnect', function () {
  console.log("Disconnected from client!")
  $settingsOverlay.style.display = "none";
  $emojiBox.style.display = "none";
  $disconnectOverlay.style.display = "flex";

  $(':button').prop('disabled', true);
  $refreshButton.disabled = false;
  
  setInterval(refreshLoop(), 11000);
});

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

//very long func that just animates it lol
var refreshString = "<i class=\"fa-solid fa-rotate-right\"></i> Refreshing in "
async function refreshLoop() {
  $refreshButton.innerHTML = refreshString + "10"
  await delay(1000);
  $refreshButton.innerHTML = refreshString + "9"
  await delay(1000);
  $refreshButton.innerHTML = refreshString + "8"
  await delay(1000);
  $refreshButton.innerHTML = refreshString + "7"
  await delay(1000);
  $refreshButton.innerHTML = refreshString + "6"
  await delay(1000);
  $refreshButton.innerHTML = refreshString + "5"
  await delay(1000);
  $refreshButton.innerHTML = refreshString + "4"
  await delay(1000);
  $refreshButton.innerHTML = refreshString + "3"
  await delay(1000);
  $refreshButton.innerHTML = refreshString + "2"
  await delay(1000);
  $refreshButton.innerHTML = refreshString + "1"
  await delay(1000);
  refreshPage()
}

$refreshButton.addEventListener("click", refreshPage);
function refreshPage() {
  location.reload();
}