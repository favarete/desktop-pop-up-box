const contextBridge = require('electron').contextBridge;
const ipcRenderer = require('electron').ipcRenderer;

// Exposed protected methods in the render process
contextBridge.exposeInMainWorld(
    'bridge', {
        sendMessage: (message) => {
            ipcRenderer.on('sendMessage', message);
        },
        windowInView: (message) => {
            ipcRenderer.on('windowInView', message);
        },
        configToRender: (message) => {
            ipcRenderer.on('configToRender', message);
        }
    }
);

window.addEventListener('DOMContentLoaded', () => {
    const btnAction = (e) => {
        e.preventDefault()
        ipcRenderer.send('actionButton')
    }
    document.getElementById('custom-button').addEventListener('click', btnAction);
})