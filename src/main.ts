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

declare function fetch(url:string, option:any):Promise<Response>;

type NOOP=()=> void;

module require {
  type PendingCallback=[NOOP,NOOP];
  const pending = new Map<string,PendingCallback[]>();
  const cached = new Set<string>();

  async function runSource(url:string, cors:boolean) {
    let option = {
      mode: cors ? 'cors' : 'no-cors'
    };
    let response = await fetch(url, option);
    let text = await response.text();
    if (text.length == 0) {
      throw new Error('empty file')
    } else {
      eval(text);
      return
    }
  }

  async function injectSource(url:string) {
    return new Promise((resolve, reject)=> {
      let script = document.createElement('script');
      script.onload = resolve;
      script.onerror = reject;
      script.async = true;
      script.src = url;
      document.head.appendChild(script);
    });
  }

  export function load(url:string, options = {inject: true, cors: false}) {
    return new Promise((resolve:NOOP, reject:NOOP)=> {
      if (cached.has(url)) {
        resolve()
      } else {
        if (pending.has(url)) {
          pending.get(url).push([resolve, reject])
        } else {
          let xss = [<PendingCallback>[resolve, reject]];
          pending.set(url, xss);
          let promise:Promise = options.inject ? injectSource(url) : runSource(url, options.cors);
          promise
            .then(()=> {
              cached.add(url);
              xss.forEach(xs=>xs[0]());
              pending.delete(url);
            })
            .catch(()=> {
              xss.forEach(xs=>xs[1]());
              pending.delete(url);
            });
        }
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
