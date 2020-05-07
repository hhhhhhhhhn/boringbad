const { app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron')
const fs = require("fs")
const util = require("util")
const exec = util.promisify(require('child_process').exec)

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1126,
        height: 720,
        icon: "./static/images/boringbad.png",
        webPreferences: {
            nodeIntegration: true
        }
    })

    mainWindow.removeMenu()

    // and load the index.html of the app.
    mainWindow.loadFile('./static/html/home.htm')

    // Open the DevTools.
    if (process.argv[2] == "test") {
        mainWindow.webContents.openDevTools()
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.allowRendererProcessReuse = true

var currentFile

ipcMain.on("file", (event, ...args) => {
    currentFile = args[0]
})

ipcMain.on("getFile", (event, ...args) => {
    event.returnValue = currentFile
})

// Exporting

ipcMain.on("export", async (event, hls, dir) => {
    var extension = "." + currentFile.split(".").slice(-1)[0]
    var fileNames = []

    var digits = String(hls.length - 1).length
    for (var i = 0; i < hls.length; i++) {
        fileNames.push(dir + "/highlight" + "0".repeat(digits - String(i).length) + String(i) + extension)
    }

    var i = 0
    event.reply("export", `exporting ${hls.length} clips`)
    for (var hl of hls) {
        try{
            await exec(`ffmpeg -i "${currentFile}" -ss ${hl[0]} -t ${hl[1] + 0.1 - hl[0]} "${fileNames[i]}"`)
            i++
        }
        catch{
            event.reply("export", "failed exporting clip")
        }
    }
    event.reply("export", `exported ${i} clips successfully`)
})

// Marking

var marks

ipcMain.on("mark", (event, ...args) => {
    marks = []
    var ret = globalShortcut.register('CommandOrControl+Q', () => {
        marks.push(new Date().getTime() / 1000)
        event.reply("text", "added mark Nº" + marks.length)
    })
    if(!ret){
        event.reply("text", "global shortcut couldn't be added")
    }else{
        event.reply("text", "marking! press ctrl+q to create a mark")
    }
})

ipcMain.on("!mark", (event, ...args)=>{
    globalShortcut.unregisterAll()
    var newFile = dialog.showSaveDialogSync({defaultPath:"marks.bbm"})
    var fileContents = ""
    for(var mrk of marks) fileContents += String(mrk) + "\n"
    fs.writeFile(newFile, fileContents, (err)=>{
        if(err) event.reply("text", "error saving marks")
        else event.reply("text", "marks saved succesfully")
    })
})