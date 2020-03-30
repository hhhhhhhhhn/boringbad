const { ipcRenderer } = require('electron')
const { dialog } = require('electron').remote

function secondsToTime(seconds){
    seconds = Math.floor(seconds)
    secs = String(seconds % 60)
    if(secs.length == 1) secs = "0" + secs
    mins = String(Math.floor(seconds % 3600 / 60))
    if(mins.length == 1) mins = "0" + mins
    hours = Math.floor(seconds / 3600)
    output = `${mins}:${secs}`
    if(hours) output = `${hours}:${output}`
    return output
}

var highlights = []

function exportClips(){
    var highlightsSort = JSON.parse(JSON.stringify(highlights))
    highlightsSort.sort((a,b)=>{
        a = Math.min(...a)
        b = Math.min(...b)
        return a - b
    })
    for(var i = 0; i < highlightsSort.length; i++){
        highlightsSort[i].sort((a, b) => a - b)
    }
    ipcRenderer.send("export", highlightsSort, JSON.stringify(dialog.showOpenDialogSync({ properties:["openDirectory"] })))
}
ipcRenderer.on("export", (event, ...args)=>{alert(args[0])})


window.onload = function (){
    var videoElement = document.getElementById("vid")
    var videoSource = ipcRenderer.sendSync("getFile")
    videoElement.setAttribute("src", videoSource)

    var vidPlaying = false
    var pauseButton = document.getElementById("play")

    function playPause(e){
        /**Plays or pauses the video, also changes the play/pause text*/
        if(vidPlaying){
            vidPlaying = false
            pauseButton.innerText = "play"
            videoElement.pause()
        }else{
            vidPlaying = true
            pauseButton.innerText = "pause"
            videoElement.play()
        }
    }

    pauseButton.addEventListener("click", playPause)


    function inHighlight(){
        for(var hl of highlights){
            if(videoElement.currentTime > Math.min(...hl) && videoElement.currentTime < Math.max(...hl)) return true
        }
        return false
    }

    var timeElement = document.getElementById("time") // Shows time
    var currentTElement = document.getElementById("currentTime")
    var barElement = document.getElementById("bar")
    var changingTime = false // If user is dragging the current time element

    setInterval(()=>{
        timeElement.innerText = `${secondsToTime(videoElement.currentTime)} / ${secondsToTime(videoElement.duration)}`
        var percentDone = 99 * videoElement.currentTime / videoElement.duration    // 99 instead of a 100 because the bar is 1 vw wide
        if(!changingTime) currentTElement.style.left = `${percentDone}vw`
        if(inHighlight()) currentTElement.style.backgroundColor = "rgb(255, 255, 0)"
        else currentTElement.style.backgroundColor = "rgb(255, 255, 255)"
    }, 200)


    currentTElement.addEventListener("mousedown", (e)=>{
        changingTime = true
    })
    document.addEventListener("mousemove", (e)=>{
        if(changingTime){
            var clientXFraction = e.clientX / window.innerWidth
            currentTElement.style.left = `${clientXFraction * 99}vw`
            timeElement.innerText = `${secondsToTime(videoElement.duration * clientXFraction)} / ${secondsToTime(videoElement.duration)}`
        }
    })
    document.addEventListener("mouseup", (e)=>{
        if(changingTime){
            var clientXFraction = e.clientX / window.innerWidth
            currentTElement.style.left = `${clientXFraction * 99}vw`
            videoElement.currentTime = videoElement.duration * clientXFraction
            timeElement.innerText = `${secondsToTime(videoElement.currentTime)} / ${secondsToTime(videoElement.duration)}`
            changingTime = false
        }
    })
    barElement.addEventListener("click", (e)=>{
        var clientXFraction = e.clientX / window.innerWidth
        currentTElement.style.left = `${clientXFraction * 99}vw`
        videoElement.currentTime = videoElement.duration * clientXFraction
        timeElement.innerText = `${secondsToTime(videoElement.currentTime)} / ${secondsToTime(videoElement.duration)}`
        changingTime = false
    })


    var lastElement = document.getElementById("last")
    function updateLastHighlight(){
        /**Updates las highlight button */
        if(highlights.length == 0) lastElement.innerText = "last: none"
        else if(highlights[highlights.length - 1].length == 2) lastElement.innerText = `last: ${secondsToTime(highlights.slice(-1)[0][0])} - ${secondsToTime(highlights.slice(-1)[0][1])}`
        else lastElement.innerText = `last: ${secondsToTime(highlights.slice(-1)[0][0])} - _____`
    }

    var highlightButton = document.getElementById("highlight")
    var highlightElements = []

    function highlight(){
        /**Adds highlight to the list, and changes the highlight/stop button's text accordingly*/
        if(highlights.length == 0 || highlights.slice(-1)[0].length == 2){
            highlights.push([videoElement.currentTime])
            highlightButton.innerText = "stop"
            var startPercent = 100 * videoElement.currentTime / videoElement.duration
            barElement.insertAdjacentHTML("beforeend", `<div class="highlight" style="left: ${startPercent}vw; width: 0.5vw"></div>`)
            highlightElements.push(barElement.lastChild)
        }else{
            highlights[highlights.length - 1].push(videoElement.currentTime)
            highlightButton.innerText = "highlight"
            highlightElements.slice(-1)[0].parentNode.removeChild(highlightElements.slice(-1)[0])
            highlightElements.pop()
            var startPercent = 100 * Math.min(...highlights.slice(-1)[0]) / videoElement.duration
            var widthPercent = 100 * Math.abs(highlights.slice(-1)[0][0] - highlights.slice(-1)[0][1]) / videoElement.duration
            barElement.insertAdjacentHTML("beforeend", `<div class="highlight" style="left: ${startPercent}vw; width: ${widthPercent}vw"></div>`)
            highlightElements.push(barElement.lastChild)
        }
        updateLastHighlight()
    }

    highlightButton.addEventListener("click", highlight)

    function undo(){
        /**Undoes last action and changes interface accordingly*/
        if(highlights.length == 0) return
        if(highlights[highlights.length - 1].length == 2){
            highlightButton.innerText = "stop"
            highlights[highlights.length - 1].pop()
            highlightElements.slice(-1)[0].parentNode.removeChild(highlightElements.slice(-1)[0])
            highlightElements.pop()
            var startPercent = 100 * highlights.slice(-1)[0][0] / videoElement.duration
            barElement.insertAdjacentHTML("beforeend", `<div class="highlight" style="left: ${startPercent}vw; width: 0.5vw"></div>`)
            highlightElements.push(barElement.lastChild)
        }else{
            highlightButton.innerText = "highlight"
            highlights.pop()
            highlightElements.slice(-1)[0].parentNode.removeChild(highlightElements.slice(-1)[0])
            highlightElements.pop()
        }
        updateLastHighlight()
    }

    document.getElementById("undo").addEventListener("click", undo)


    var markerElements = []

    function addMark(){
        /**Adds marker to current time */
        var startPercent = 100 * videoElement.currentTime / videoElement.duration
        barElement.insertAdjacentHTML("beforeend", `<div class="mark" style="left: ${startPercent}vw"></div>`)
        markerElements.push(barElement.lastChild)
    }

    function undoMark(){
        if(markerElements.length == 0) return
        markerElements.slice(-1)[0].parentNode.removeChild(markerElements.slice(-1)[0])
        markerElements.pop()
    }

    document.getElementById("mark").addEventListener("click", addMark)


    var advencedSettings = false
    var advancedSettingsElement = document.getElementById("advanced")

    document.getElementById("more").addEventListener("click", (e)=>{
        if(!advencedSettings){
            e.target.innerText = "less..."
            advancedSettingsElement.style.display = "initial"
            advencedSettings = true
        }else{
            e.target.innerText = "more..."
            advancedSettingsElement.style.display = "none"
            advencedSettings = false
        }
    })

    document.getElementById("undoMark").addEventListener("click", undoMark)


    document.getElementById("speed").addEventListener("change",(e)=>{
        var val = Number(e.target.value)
        if(val != NaN && val > 0 && val < 100){
            videoElement.playbackRate = val
        }
    })


    document.getElementById("export").addEventListener("click", exportClips)



    document.addEventListener("keydown", (e)=>{
        if(e.code == "Space"){
            e.preventDefault()
            playPause()
        }else if(e.code == "ArrowLeft"){
            e.preventDefault()
            videoElement.currentTime -= 5
        }else if(e.code == "ArrowRight"){
            e.preventDefault()
            videoElement.currentTime += 5
        }else if(e.code == "KeyZ" && e.ctrlKey){
            e.preventDefault()
            undo()
        }else if(e.code == "ShiftLeft"){
            e.preventDefault()
            highlight()
        }else if(e.code == "KeyA" && e.ctrlKey){
            e.preventDefault
            addMark()
        }
    })
}