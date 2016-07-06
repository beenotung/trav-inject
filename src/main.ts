/**
 * Created by beenotung on 7/6/16.
 */
console.log('ts main:start');
// Object.keys(window).map(x=>'key : ' + x).forEach(console.log);
console.log('ts main:end');

function delay(time:number) {
  return new Promise((resolve, reject)=> {
    // console.warn('before wait', time);
    let t = time * Math.random();
    setTimeout(()=> {
      // console.log('after wait', time);
      resolve(t);
    }, t)
  });
}

async function run(time:number) {
  console.log('before run', time);
  let a = await delay(time);
  console.log('after run', time, a);
}

let tasks = Array.from(new Set([1, 2, 3, 4, 4, 2, 1]))
  .map(x=>x * 1000)
  .forEach(x=>run(x));
