/**
 * The following is from the quickstart
 * https://github.com/electron/electron/blob/master/docs/tutorial/quick-start.md
 *
 * - Just the `createWindow` `url` is changed to point to alm
 * - The osx special handling is removed
 */

import electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

function createWindow(url:string) {
  // Create the browser window.
  let win = new BrowserWindow({
    autoHideMenuBar: true
  });

  // and load the index.html of the app.
  win.loadURL(url);

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    const {listeningAtUrl} = require("../server");
    listeningAtUrl.on(({url}) => createWindow(url));
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    app.quit();
});
