#!/bin/bash
if [ ! -d node_modules ]; then
  npm install
fi
if [ ! -f .quick-deploy ]; then
  touch .quick-deploy
  npm run dev &
  sleep 8;
fi
cat dist/bundle.js | xclip -sel clipboard && echo 'copied to clipboard'
