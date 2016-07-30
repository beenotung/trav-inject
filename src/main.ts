/**
 * Created by beenotung on 28/7/16.
 */

// require.load('bundle.css');

document.title = 'seed';

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
  console.log('result', await result.value());
}

play();
