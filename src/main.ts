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

declare type Response={
  ok:boolean;
  status:number;
  statusText:string;
  type:string;
  url:string;
  headers:any;
  body:any;
  arrayBuffer():any;
  text():Promise<string>;
  json():any;
  blob():any;
};

declare function fetch(url:string):Promise<Response>;

type NOOP=()=> {};

module require {
  const cache = new Map<string,number>();
  const downloading = 1;
  const downloaded = 2;
  const pending = new Map<string,NOOP[]>();

  export function load(url:string) {
    return new Promise((resolve:NOOP, reject)=> {
      if (cache.has(url)) {
        console.debug('cached', url);
        if (cache.get(url) == downloaded) {
          resolve();
        } else {
          if (!pending.has(url)) {
            pending.set(url, [])
          }
          pending.get(url).push(resolve);
        }
      }
      else {
        console.debug('downloading', url);
        cache.set(url, downloading);
        fetch(url).then(response=> {
          console.debug('downloaded', url);
          response.text().then(text=> {
            eval(text);
            cache.set(url, downloaded);
            resolve();
            if (pending.has(url)) {
              pending.get(url).forEach((x=>x()));
              pending.delete(url);
            }
          });
        });
      }
    });
  }
}
declare const $:any;
async function printline(...xs:any[]) {
  await require.load('dist/lib/jquery/dist/jquery.js');
  // console.log('$', $);
  $(window).ready(()=> {
    let e = document.createElement('p');
    e.innerText = xs.join();
    document.body.appendChild(e);
  });
}

async function run(time:number) {
  printline('before run', time);
  let a = await
    delay(time);
  printline('after run', time, a);
}

let tasks = Array.from(new Set([1, 2, 3, 4, 4, 2, 1]))
  .map(x=>x * 1000)
  .forEach(x=>run(x));
