#!/bin/bash
if [ ! -d node_modules ]; then
  npm install
fi
res=$(ps aux | grep npm | wc -l)
if [ $res -eq 1 ]; then
 rm -f ./.quick-deploy
fi
if [ ! -f .quick-deploy ]; then
  touch .quick-deploy
  npm run dev &
  sleep 8;
fi
cat lib/babel-polyfill/browser-polyfill.js dist/bundle.js | xclip -sel clipboard
if [ $? -eq 0 ]; then
  echo 'copied to clipboard'
else
  sleep 5;
  ./quick-deploy.sh
fi
