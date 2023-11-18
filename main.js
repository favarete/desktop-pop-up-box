const {app, ipcMain, BrowserWindow, Tray, Menu} = require('electron')
require('dotenv').config()
const path = require('node:path')

// TODO: Can I avoid declaring it here?
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        frame: false, skipTaskbar: true, alwaysOnTop: true, width: 800, height: 600, webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.loadFile('index.html')
        .then(() => {
            mainWindow.webContents.send('sendMessage', process.argv[2]);
        })
        .then(() => {
            mainWindow.show();
        });

    //mainWindow.webContents.openDevTools()
}

function createContextMenu() {
    return Menu.buildFromTemplate([{
        label: 'Fechar', click: () => {
            app.isQuiting = true;
            app.quit();
        }
    }])
}

function createTray() {
    const tray = new Tray(path.join(__dirname, 'alert.ico'))
    tray.setToolTip('Epa, eu sou um alerta de notificação do Marvin =)');
    tray.setContextMenu(createContextMenu());

    tray.on('right-click', () => {
        tray.popUpContextMenu();
    })

    tray.on('click', () => {
        if (mainWindow.isVisible()) mainWindow.minimize(); else mainWindow.show();
    });
}

app.whenReady().then(() => {
    createWindow()
    createTray()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

function postMessageAndClose() {
    fetch(process.env.ADVANCED_AUTOMATION_HOOK, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: process.argv[2]
        }),
    }).then(_ => app.quit());
}

ipcMain.on('close', () => {
    if (process.platform !== 'darwin') {
        postMessageAndClose();
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        postMessageAndClose();
    }
})