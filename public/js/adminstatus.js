//set admin status and reveal admin panel

socket.on("admin-status", isAdmin => {
  if (isAdmin[0]) {

    userHashed = isAdmin[1] + username

    adminPanelStyle = true;
    $adminStatus.innerHTML = "<i class=\"fa-solid fa-lock-open\"></i> You are a Admin!";

    $adminStatus.style.backgroundColor = 'var(--messages)';
    $adminStatus.style.borderRadius = '4px 4px 0px 0px';
    $adminStatus.style.paddingTop = '4px';
    $adminStatus.style.paddingLeft = '4px';
    $adminStatus.style.paddingRight = '4px';
    $adminPanel.style.display = "flex";
  } else {
    adminPanelStyle = false;
    $adminStatus.innerHTML = "<i class=\"fa-solid fa-lock\"></i> You aren't a Admin!";
  }
});
