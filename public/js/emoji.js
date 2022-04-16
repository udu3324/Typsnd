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