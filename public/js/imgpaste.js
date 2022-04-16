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