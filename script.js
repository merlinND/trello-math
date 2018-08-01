/**
 * Script to be injected into the electron app.
 */

document.addEventListener("keydown", function (e) {
    if (e.which === 123) {
        // F12
        require("electron").remote.BrowserWindow.getFocusedWindow().webContents.toggleDevTools();
    } else if (e.which === 116) {
        // F5
        location.reload();
    } else if (e.which === 79) {
        // O
        console.log("It works!");
    }
});

console.log("We're in.");
