# cmod3

[![Join the chat at https://gitter.im/jllodra/cmod3](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/jllodra/cmod3?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/jllodra/cmod3.svg?branch=master)](https://travis-ci.org/jllodra/cmod3)

cmod3 is a module music player.

## Download cmod3

[Releases page on GitHub](https://github.com/jllodra/cmod3/releases)

Versions for **Mac OSX x64**, **Windows x64**, and **Linux x64** available.

![cmod3](https://raw.githubusercontent.com/jllodra/cmod3/master/screenshot.png "cmod3")
![cmod3](https://raw.githubusercontent.com/jllodra/cmod3/master/screenshot2.png "cmod3")

Don't you know what tracked music is? [Look here](http://en.wikipedia.org/wiki/Music_tracker).

cmod3 website: <http://cmod3.atlantisofcode.com>.

Browse the Wiki for more information.

## Features

* Play/Stop/Pause/Seek...
* Drag and drop (folders and files)
* Metadata for the current module
* Repeat and shuffle modes
* Classic VU meter
* Keyboard shortcuts: OSX multimedia keys, <space> play/pause, num 1-5
* **Nectarine Radio player built-in!**
* **Browse and download from Modarchive!**

## How does cmod3 work?

cmod3 is entirely written in **Javascript**, works on node-webkit (nwjs) and uses libopenmpt compiled with emscripten plus closure-compiler. The user interface is based on bootstrap and angular is the framework of choice. Despite all that, and after some hard work, it performs really well.

## Things yet to do

* ~~Settings are not being saved yet.~~
* ~~Keyboard shortcuts (1, 2, 3, 4, 5 and mediakeys).~~
* ~~Volume control using a GainNode.~~
* ~~Choose a Nectarine stream among a list of streams.~~
* ~~Adding an AnalyserNode could enable VU meter for nectarine.~~
* More playlist features.
* Can you draw? An nice app icon is needed.
* Audio is being decoded on the main thread, which is not ideal, it should be done on a background worker/thread (not possible afaik, any idea? Audio Workers issue: <https://bugs.chromium.org/p/chromium/issues/detail?id=469639>).
* New ideas? Open an Issue.

## Versions

07/10/2016: 2.1.1 - files are alphabetically loaded

12/03/2016: 2.1.0 - double click to play songs, just like regular players, other improvements

08/03/2016: 2.0.4 - minor improvements

07/03/2016: 2.0.3 - bugfixes with mediakeys

06/03/2016: 2.0.2 - mac icon fixed

04/03/2016: 2.0.1 - optimizations, metadata reading in webworker, glitch-free, bugfixes

08/10/2015: 1.8.0 - gain control

07/10/2015: 1.7.0 - nectarine and ui enhancements

06/10/2015: 1.6.0 - bugfixes and tons of enhancements

05/10/2015: 1.5.0 - modarchive support

24/09/2015: 1.1.0 - not released

25/05/2015: 1.0.0 - public release

17/04/2015: 0.0.5 - beta

## Do you like it?

Contribute to the code via pull-requests and make this player better, or make a donation via paypal to jlg.hrtc@gmail.com, modarchive.org and scenemusic.net as well.
