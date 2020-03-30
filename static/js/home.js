const { dialog } = require('electron').remote
const { ipcRenderer } = require('electron')

function loadFile(){
    var file = dialog.showOpenDialogSync({ properties: ['openFile'] })[0]
    ipcRenderer.send("file", file)
    window.location.href = "./edit.htm"
}

window.onload = loadFile