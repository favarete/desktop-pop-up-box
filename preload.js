const contextBridge = require('electron').contextBridge;
const ipcRenderer = require('electron').ipcRenderer;

// Exposed protected methods in the render process
contextBridge.exposeInMainWorld(
    'bridge', {
        sendMessage: (message) => {
            ipcRenderer.on('sendMessage', message);
        }
    }
);

window.addEventListener('DOMContentLoaded', () => {
    // close app
    function closeApp(e) {
        e.preventDefault()
        ipcRenderer.send('close')
    }
    document.getElementById('close-btn').addEventListener('click', closeApp);
})