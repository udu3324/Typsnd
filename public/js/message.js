var menuOpened = false;
var theMenuOpened;

var timeOut1
var timeOut2
var timeOut3

function stopAnimation() {
    clearTimeout(timeOut1)
    clearTimeout(timeOut2)
    clearTimeout(timeOut3)
}

function toggleMenu(menu, bool) {
    if (bool) {
        console.log("menu opened!")
        theMenuOpened = menu;
        menu.style.opacity = 0.95;
        menu.style.pointerEvents = "all";
        menuOpened = true;
    } else {
        stopAnimation()

        console.log("menu closed!")
        menu.style.opacity = 0.0;
        menu.style.pointerEvents = "none";
        menuOpened = false;

        menu.parentNode.querySelector("#message-options").style.opacity = 0.0;

        //allow other buttons to be pressed
        var buttons = document.getElementsByClassName("message-options");
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].style.pointerEvents = "all";
        }
    }
}

function createMessageOptions(div) {
    var button = div.querySelector("#message-options");

    var menu = div.querySelector("#message-options-div");
    var mention = div.querySelector("#menu-mention-button");
    var kick = div.querySelector("#menu-kick-button");
    var ban = div.querySelector("#menu-ban-button");
    var close = div.querySelector("#menu-close-button");

    var username = div.firstElementChild.firstElementChild.innerHTML

    var user = username;
    if (user.includes("</i>"))
        user = user.substring(username.indexOf("</i>") + 5)

    //Menu Div

    mention.onclick = function () {
        if (username.includes("</i>"))
            username = username.substring(username.indexOf("</i>") + 5);

        $messageFormInput.value += "@" + username + " "
        toggleMenu(menu, false)
    };

    kick.onclick = function () {
        console.log("kick attempted!")
        if (isAnAdmin) {
            $kickUserInput.value = user
            kickUser()
        } else {
            alertAsync("Yea no, you aren't an Admin.")
        }
        toggleMenu(menu, false)
    };

    ban.onclick = function () {
        console.log("ban attempted!")
        if (isAnAdmin) {
            $banUserInput.value = user
            banUser()
        } else {
            alertAsync("Yea no, you aren't an Admin.")
        }
        toggleMenu(menu, false)
    };

    close.onclick = function () {
        console.log("closed!")
        toggleMenu(menu, false)
    };


    //Message Div

    button.onclick = function () {
        console.log("clicked!")
        if (!menuOpened) {
            toggleMenu(menu, true)

            //close menu automatically after 5s
            close.innerHTML = "<i class=\"fa-solid fa-xmark\"></i> Close (3)"

            timeOut1 = setTimeout(function () {
                close.innerHTML = "<i class=\"fa-solid fa-xmark\"></i> Close (2)"
            }, 1000);
            timeOut2 = setTimeout(function () {
                close.innerHTML = "<i class=\"fa-solid fa-xmark\"></i> Close (1)"
            }, 2000);
            timeOut3 = setTimeout(function () {
                if (!menuOpened) return
                toggleMenu(menu, false)
                close.innerHTML = "<i class=\"fa-solid fa-xmark\"></i> Close"
            }, 3000);
        } else {
            //check if there are any other menus opened
            if (document.body.contains(theMenuOpened) && theMenuOpened.style.opacity > 0.1) {
                //close last menu
                theMenuOpened.style.opacity = 0.0;
                theMenuOpened.style.pointerEvents = "none";

                //close button
                theMenuOpened.parentNode.querySelector("#message-options").style.opacity = 0.0;

                //open requested menu
                menu.style.opacity = 0.95;
                menu.style.pointerEvents = "all";
                menuOpened = false
            } else {
                toggleMenu(menu, false);
            }
        }
    };

    div.mouseIsOver = false;

    div.onmouseover = function () {
        this.mouseIsOver = true;
        //reveal the messages options button if menu is closed
        if (!menuOpened)
            button.style.opacity = 1.0;
        else
            button.style.pointerEvents = "none"
    };
    div.onmouseout = function () {
        this.mouseIsOver = false;
        if (menuOpened) {
            //check if there are any other menus opened
            if (!(document.body.contains(theMenuOpened) && theMenuOpened.style.opacity > 0.1)) {
                button.style.opacity = 1.0;

            }
        } else {
            button.style.opacity = 0.0;
        }
    }
}