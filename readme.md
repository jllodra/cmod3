# cmod3

[![Join the chat at https://gitter.im/jllodra/cmod3](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/jllodra/cmod3?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

cmod3 is a module music player.

![cmod3](https://raw.githubusercontent.com/jllodra/cmod3/master/screenshot.png "cmod3")

Don't you know what tracked music is? [Look here](http://en.wikipedia.org/wiki/Music_tracker).
Watch cmod3 in action here: <https://www.youtube.com/watch?v=ZDABiY7pAk0>.

## Download cmod3 1.0.0

* Mac OSX x64: <http://herotyc.untergrund.net/cmod3/cmod3-1.5.0-osx64.zip>
* Windows x64: <http://herotyc.untergrund.net/cmod3/cmod3-1.5.0-win64.zip>
* Linux x64: <http://herotyc.untergrund.net/cmod3/cmod3-1.5.0-linux64.zip>

## Features

* Play/Stop/Pause/Seek...
* Drag and drop (folders and files)
* Metadata for the current module
* **Nectarine Radio player built-in!**
* Repeat and shuffle modes
* Classic VU meter

## How does cmod3 work?

cmod3 is entirely written in **Javascript**, works on node-webkit (nwjs) and uses libopenmpt compiled with emscripten plus closure-compiler. The user interface is based on bootstrap and angular is the framework of choice. Despite all that, and after some hard work, it performs really well.

## Things yet to do

* Can you draw? An app icon is needed.
* Audio is being decoded on the main thread, which is not ideal, it should be done on a background worker/thread and see if it performs better.
* Settings are not being saved yet.
* Keyboard shortcuts.
* Adding an AnalyserNode could enable fft visualization.
* Volume control using a GainNode.
* Choose a Nectarine stream among a list of streams.

## Versions

24/09/2015: 1.x.x - not released yet
- Play+Pause in one button

25/05/2015: 1.0.0 - public release

17/04/2015: 0.0.5 - beta

## Do you like it?

Contribute to the code make this player better, or make a donation via paypal to jlg.hrtc@gmail.com if you want to thanks the developer.
