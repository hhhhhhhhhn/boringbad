const { dialog } = require('electron').remote
const { ipcRenderer } = require('electron')

function loadFile(){
    var file = dialog.showOpenDialogSync({ properties: ['openFile'] })[0]
    ipcRenderer.send("file", file)
    window.location.href = "./edit.htm"
}

var marking = false

function toggleMarks(){
    if(marking){
        ipcRenderer.send("!mark")
        document.getElementById("marks").innerText = "create marks"
        marking = false
        return
    }
    ipcRenderer.send("mark")
    document.getElementById("marks").innerText = "stop marking"
    marking = true
}

ipcRenderer.on("text", (event, ...args)=>{
    document.getElementById("info").innerText = args[0]
})

window.onload = function(){
    document.getElementById("file").addEventListener("click", loadFile)
    document.getElementById("marks").addEventListener("click", toggleMarks)
}
