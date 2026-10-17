/* Electron's documented desktop entry point uses CommonJS. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const ONLINE_URL = "https://digital-card-os.hatchable.site/wallet/";
function createWindow() {
  const win = new BrowserWindow({
    width: 1180, height: 820, minWidth: 360, minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: "#071b2d",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://digital-card-os.hatchable.site/")) {
      void shell.openExternal(url);
    } else if (url.startsWith("https://") || url.startsWith("mailto:") || url.startsWith("tel:")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });
  win.loadURL(ONLINE_URL).catch(() => win.loadFile(path.join(__dirname, "offline.html")));
  win.webContents.on("did-fail-load", (_event, code, _desc, url, isMainFrame) => {
    if (isMainFrame && code !== -3 && !url.startsWith("file://")) {
      win.loadFile(path.join(__dirname, "offline.html"));
    }
  });
}
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
