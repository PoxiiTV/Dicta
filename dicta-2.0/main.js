const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Ignorar errores de certificado para nuestro localhost autofirmado
app.commandLine.appendSwitch('ignore-certificate-errors');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 320,
        height: 250,
        alwaysOnTop: true,
        autoHideMenuBar: true,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'icon.png')
    });

    // Cargar la web con el parámetro isDesktop para activar el modo mini
    mainWindow.loadURL('https://localhost:3000?isDesktop=1');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Permitir cerrar desde el HTML
ipcMain.on('close-window', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

// Permitir redimensionar ventana
ipcMain.on('resize-window', (event, { width, height }) => {
    if (mainWindow) {
        mainWindow.setSize(width, height);
    }
});

// Copiar texto usando el proceso principal
ipcMain.on('copy-text', (event, text) => {
    const { clipboard } = require('electron');
    clipboard.writeText(text);
});

// Arrancar el servidor Express localmente dentro del mismo proceso
require('./server.js');

app.whenReady().then(() => {
    // Le damos 1 segundo al servidor para levantar antes de cargar la ventana
    setTimeout(createWindow, 1000);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
