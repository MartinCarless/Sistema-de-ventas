import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import os from "os";

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1000,
    height: 600,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.on("maximize", () => {
    win?.webContents.send("window-state", "maximized");
  });

  win.webContents.openDevTools();

  // Cuando la ventana se restaure al tamaño normal
  win.on("unmaximize", () => {
    win?.webContents.send("window-state", "windowed");
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
}

ipcMain.on("minimize-window", () => {
  win?.unmaximize();
});
ipcMain.on("maximize-window", () => {
  win?.maximize();
});
ipcMain.on("close-window", () => {
  win?.close();
});
ipcMain.handle("get-system-memory", async (event, ...args) => {
  // Aquí iría la lógica para obtener la información de la memoria
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  return { totalMemory, freeMemory };
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
