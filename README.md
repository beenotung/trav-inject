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
| Dolphin Browser | (Android >= 4.0.3) |
| UC Browser | (Android >= 4.0.3) |
*Only tested on Chrome*
### Without tampermonkey
Any Browser that support Javascript (the official Trav*** requirement include Javascript anyway...).
However, you will have to paste the javascript code into console everytime the page switch or reload... which is a big pain, therefore recommend to use tampermonkey or other equivalent tools

## Configuration
 - Set your username and password in src/config.ts before building the project

## Build
 - run `./quick-deploy.sh`
   the built version should be copied to (X11) system clipboard (this feature is supported only on Linux currently)

## Installation
1. Install [tampermonkey](http://tampermonkey.net/) in your browser
2. Add the built script as userscript
3. Add user includes `http://tx3.trav***.tw/*` in the settings page
   Replace the url for your world if needed
4. Enable the script from the tampermonkey icon (in Chrome, the extension icon should be in top right bar)

## Feature Todo List
 - [x] Auto upgrade 'farms' (4 types of resources producer, not just crop)
    - [x] According to 'time reminds to full'
    - [x] Support if VIP is available (pending building task) (not tested)
 - [ ] Auto upgarde facilities (inner village buildings)
 - [ ] Auto train army
 - [ ] Auto send army
 - [ ] Auto find sheep-like villages
 - [ ] Auto find places for new villages
 - [ ] Auto trade (hero_auction)
 - [ ] Auto trade
    - [ ] Balance resource within self villages
    - [ ] To Alliance on excess resources
