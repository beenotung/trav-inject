#!/bin/bash
if [ ! -d node_modules ]; then
  npm install;
fi
npm run pack && cat out/bundle.js | xclip -sel clipboard && echo 'copied to clipboard'
