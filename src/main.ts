/**
 * Created by beenotung on 28/7/16.
 */

// require('babel-polyfill'); // does not work, need to include in browser

// require.load('bundle.css');

document.title = 'seed';

function print(...xs: any[]) {
  Array.prototype.forEach.call(arguments, (s: string)=> {
    document.body.appendChild(document.createElement('p')).textContent = s;
  })
}

print('hello world');

async function rollDice() {
  return new Promise((resolve, reject)=> {
    setTimeout(resolve(Math.random()), 1000)
  });
}

function * gamble() {
  for (; ;) {
    yield rollDice
  }
}

async function play() {
  let player = gamble();
  let result = player.next();
  let func = result.value;
  console.log('result', await func());
}

play();

print('this should be blue');

// require('test');
import {require as JsRequire} from "../lib/jslib/es6/dist/es6/src/utils-es6"
console.log('code', JsRequire.load.toString());
print(JsRequire.load.toString())
