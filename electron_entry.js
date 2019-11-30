const { app, BrowserWindow, ipcMain, screen } = require('electron');

function createWindow () {
  // Erstelle das Browser-Fenster.
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      devTools: false,  
    },
    useContentSize: true,
    center: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'Minesweeper',
    autoHideMenuBar: true,
  });

  ipcMain.on('resize-to-content', (event, arg) => {
    let reply = {xOverflow: false, yOverflow: false};
    let screenSize = screen.getPrimaryDisplay().bounds;
    let {x: width, y: height} = JSON.parse(arg);
    let newWidth = width + 60;
    let newHeight = height + 160;

    let widthOverflow = newWidth > screenSize.width;
    let heightOverflow = newHeight > screenSize.height;

    win.setSize(
      widthOverflow ? screenSize.width : newWidth, 
      heightOverflow ? screenSize.height : newHeight
    );
    win.center();

    if(widthOverflow) reply.xOverflow = true;
    if(heightOverflow) reply.yOverflow = true;

    event.reply('resize-to-content-reply', JSON.stringify(reply));
  })

  global.HTMLElement = win.HTMLElement;
  
  // und lade die index.html der App.
  win.loadFile('index.html')

  let contents = win.webContents
  console.log(contents)
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // Unter macOS ist es üblich, für Apps und ihre Menu Bar
  // aktiv zu bleiben, bis der Nutzer explizit mit Cmd + Q die App beendet.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Unter macOS ist es üblich ein neues Fenster der App zu erstellen, wenn
  // das Dock Icon angeklickt wird und keine anderen Fenster offen sind.
  if (win === null) {
    createWindow();
  }
});

