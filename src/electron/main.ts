/**
 * The following is from the quickstart
 * https://github.com/electron/electron/blob/master/docs/tutorial/quick-start.md
 *
 * - Just the `createWindow` `url` is changed to point to alm
 * - The osx special handling is removed
 */

const electron = require('electron');
// Module to control application life.
const {app} = electron;
// Module to create native browser window.
const {BrowserWindow} = electron;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow(url:string) {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600});

  // and load the index.html of the app.
  win.loadURL(url);

  // Open the DevTools.
  win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
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
