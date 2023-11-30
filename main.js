const {app, ipcMain, BrowserWindow, Tray, Menu} = require('electron')

require('dotenv').config()
const path = require('node:path')

require('electron').powerSaveBlocker.start('prevent-app-suspension');

const DEBUGGING = false
// TODO: Can I avoid declaring it here?
let mainWindow
let NEXT_NOTIFICATION_ID

function createWindow() {
    mainWindow = new BrowserWindow({
        frame: false,
        show: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.loadFile('index.html')
        .then(() => {
            mainWindow.webContents.send('windowInView', false)
        });

    if(DEBUGGING){
        mainWindow.webContents.openDevTools()
    }
    void setNextNotification()
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
    const tray = new Tray(path.join(__dirname, 'trayClock.ico'))
    tray.setToolTip('Epa, estou esperando uma notificação do Marvin =)');
    tray.setContextMenu(createContextMenu());

    tray.on('right-click', () => {
        tray.popUpContextMenu();
    })
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


function setNextNotificationID(notificationID) {
    NEXT_NOTIFICATION_ID = notificationID
}

function getNextNotificationID() {
    return NEXT_NOTIFICATION_ID
}

async function postMessageAndWait() {
    const taskId = getNextNotificationID()
    if (DEBUGGING) {
        console.log("Will remove: ", taskId)
    }
    await fetch(`${process.env.API_URL}/api/markDone`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Full-Access-Token': process.env.FULL_ACCESS_TOKEN
        },
        body: JSON.stringify({
            itemId: taskId
        }),
    })
    mainWindow.minimize()
    mainWindow.webContents.send('windowInView', false)
    void setNextNotification()
}

async function getListOfReminders() {
    return (await fetch(`${process.env.API_URL}/api/reminders`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Full-Access-Token': process.env.FULL_ACCESS_TOKEN
        }
    })).json();
}

async function setNextNotification() {
    const reminders = await getListOfReminders()
    const sortedReminders = reminders.sort((x, y) => {
        return x.time - y.time;
    })

    const nextNotificationRaw = sortedReminders?.[0] ?? false;
    if (nextNotificationRaw) {
        setNextNotificationID(nextNotificationRaw['reminderId'])
    }

    const fullDatetime = new Date(
        DEBUGGING ? "2020-01-20T10:00:00.000Z" : nextNotificationRaw.time * 1000)

    const re = /^(?:\d|[01]\d|2[0-3]):[0-5]\d/;
    const timeText = re.exec(nextNotificationRaw.title)[0];
    const notificationText = nextNotificationRaw.title.replace(
        RegExp(`${timeText}`, 'g'), '').trim();

    mainWindow.webContents.send('sendMessage', {timeText, notificationText});

    const timeNow = new Date().getTime()
    const timeAlert = fullDatetime.getTime()
    const triggerAfter = timeAlert - timeNow

    const timerID = setInterval(() => {
        showAlert(timerID)
    }, triggerAfter);
}

function showAlert(timerSetterID) {
    clearInterval(timerSetterID)
    mainWindow.webContents.send('windowInView', true)
    mainWindow.show()
}

ipcMain.on('actionButton', () => {
    if (process.platform !== 'darwin') {
        void postMessageAndWait()
    }
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
