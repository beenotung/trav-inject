# trav-inject
##### Browser based automater, Truely cross platform
Trav*** web-based game tool

## Compile-time dependency
 - git
 - npm

## Runtime dependency
### With tampermonkey
| Browser | Version Requirement |
|---|---|
| Chrome | >= 31 |
| Microsoft Edge | >= 14 |
| Safari | >= 5 |
| Firefox | >= 46 |
| Opera Next | >= 15 |
| Dolphin Browser (Android | >= 4.0.3) |
| UC Browser (Android | >= 4.0.3) |
*Only tested on Chrome*
### Without tampermonkey
Any Browser that support Javascript (the official Trav*** requirement include Javascript anyway...).
However, you will have to paste the javascript code into console everytime the page switch or reload... which is a big pain, therefore recommend to use tampermonkey or other equivalent tools

## Build
 - run `./quick-deploy.sh`
   the built version should be copied to (X11) system clipboard (this feature is supported only on Linux currently)

## Installation
1. install [tampermonkey](http://tampermonkey.net/) in your browser
2. add the built script as userscript
3. add user includes `http://tx3.trav***.tw/*` in the settings page
   replace the url for your world if needed
4. enable the script from the tampermonkey icon (in Chrome, the extension icon should be in top right bar)
