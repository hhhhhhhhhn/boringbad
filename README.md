# boringbad

Fast and simple video trimmer built in electron

## Usage

First, select the video. Then create highlights using the `highlight` button or using the shift key. You can add markers with the `mark` button, or by pressing Ctrl+A (they can be deleted by right-clicking). When ready, click `more` and press the `export` button, select a folder, and your highlights will be exported.

### Mark tool

In the home menu, click the `create marks`. From now on, when pressing Ctrl+Q, a marker will be saved(it's a global shortcut). After finishing, click the `stop marking` button and save the marks to a file. You import the marks while editing a video. First, find the time of the last mark, and then click `more` and the `import marks` button. Here, you have to select the saved file, and then enter the previously mentioned time. Markers should now appear on the timeline.

This tool is meant to help by allowing to mark times even if there is no finished video / no way to time it (like in streams.)

## Note

boringbad requires `ffmpeg` as a CLI command. In windows, you'll need to add it to PATH.

This tool has only been tested on windows.