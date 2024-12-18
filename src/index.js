const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let isShownFace = false,
  bigFace = false,
  winFace = null,
  winCounter = null,
  isCamRounded = false,
  mainWindow;

// Create the rounded face window.
const createWinFace = () => { 
  winFace = new BrowserWindow({
    width: 333,
    height: 240,
    alwaysOnTop: true,
    maximizable:false,
    frame: false,
    // show: false,
    transparent: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true
    }
  });
  winFace.setAlwaysOnTop(true, "screen-saver");
  winFace.loadFile(path.join(__dirname, 'face.html'));
  winFace.webContents.on('did-finish-load', () => {
    winFace.webContents.send('loaded', [isCamRounded]);
  });
  // winFace.webContents.openDevTools();
  bigFace = false;

  winFace.on('close', function(){
    winFace = null;
    isShownFace = false;
    bigFace = false;
  });

}


// Create the counter window.
const createWinCounter = () => { 
  winCounter = new BrowserWindow({
    width: 425,
    height: 425,
    alwaysOnTop: true,
    maximizable:false,
    frame: false,
    // show: false,
    transparent: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true
    }
  });
  winCounter.setAlwaysOnTop(true, "screen-saver");
  winCounter.loadFile(path.join(__dirname, 'counter.html'));
}


// Create the main menu window.
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 850,
    height: 675,
    autoHideMenuBar: true,
    icon: __dirname +'/assets/jscast-icon.ico',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  });
  mainWindow.removeMenu();
 
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'main-menu.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  mainWindow.on('close', () => {
    if (winCounter != null) winCounter.close();
    if (winFace != null) winFace.close();
  });

  //Toggles the visibility of the rounded face
  ipcMain.on('faceBtn-clicked', (event, roundedCam) => {
    if(!isShownFace) {
      isCamRounded = roundedCam;
      createWinFace();
      if(isCamRounded) winFace.setSize(290,290);
      isShownFace = true;
    } else {
      winFace.close();
      winFace = null;
      isShownFace = false;
    }
  });

  //Shows and hides de counter and minimize main window if it is required.
  ipcMain.on('start-record', (event, minimize) => {
    createWinCounter();
    setTimeout( () => {
      winCounter.close();
      winCounter = null;
    }, 6000);
    if (minimize) mainWindow.minimize();
  });

  ipcMain.on('stop-record', () => {
    mainWindow.focus();
  });

};


// Allow only one instance of electron
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  });


  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    
    globalShortcut.register('Alt+CommandOrControl+1', () => {
      if(winFace !=null ) {
        if (bigFace && isCamRounded) {
          winFace.setSize(290,290);
          winFace.setPosition(winFace.getPosition()[0] + 205, winFace.getPosition()[1] + 205);
          bigFace = false;
        
        } else if (bigFace && !isCamRounded) {
          winFace.setSize(320, 240);
          winFace.setPosition(winFace.getPosition()[0] + 240, winFace.getPosition()[1] + 180);
          bigFace = false;
          
        } else if(!bigFace && isCamRounded) {
          winFace.setSize(700, 700);
          winFace.setPosition(winFace.getPosition()[0] - 205, winFace.getPosition()[1] - 205);
          bigFace = true;

        } else { //(!bigFace && !isCamRounded)
          winFace.setSize(800,600);
          winFace.setPosition(winFace.getPosition()[0] - 240, winFace.getPosition()[1] - 180);
          bigFace = true;
        }
      }
    });

    globalShortcut.register('Alt+CommandOrControl+9', () => {
      mainWindow.webContents.send('please-stop');
    });
  }).then(createWindow)

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
