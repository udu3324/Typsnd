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
async function refreshLoop() {
  for (let index = 0; index < 10; ++index) {
    $refreshButton.innerHTML = "<i class=\"fa-solid fa-rotate-right\"></i> Refreshing in " + (10 - index)
    await delay(1000);
  }
  refreshPage()
}

$refreshButton.addEventListener("click", refreshPage);
function refreshPage() {
  location.reload();
}