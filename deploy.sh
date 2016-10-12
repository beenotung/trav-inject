#!/bin/bash
bash build.sh && cat lib/babel-polyfill/browser-polyfill.js dist/bundle.js | xclip -sel clipboard
