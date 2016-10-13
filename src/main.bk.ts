// import * as $ from 'jquery';
import {config} from './config'

const app_name = 'travian-auto';
const app_version = "1.0";

/* -------------------- begin utils ----------------------*/
function has(name: any) {
  let x = localStorage[JSON.stringify(name)];
  return x != void 0 && x != null;
}
function set(name: any, value: any) {
  localStorage[JSON.stringify(name)] = JSON.stringify(value);
}
function get<A>(name: any, fallback: ()=>A): A {
  if (has(name)) {
    try {
      return JSON.parse(localStorage[JSON.stringify(name)]);
    } catch (e) {
      return fallback();
    }
  }
  else {
    return fallback();
  }
}
function getOrSetDefault<A>(name: any, fallback: ()=>A): A {
  if (has(name)) {
    return get(name, fallback);
  } else {
    let v = fallback();
    set(name, v);
    return v;
  }
}
function last<A>(xs: A[]) {
  return xs[xs.length - 1];
}
function isDefined(x: any) {
  return x != void 0 && x != null;
}
function noDefined(x: any) {
  return !isDefined(x);
}
class Optional<A> {
  value: A;

  constructor(x?: any) {
    this.value = x;
  }

  isDefined() {
    return this.value != void 0 && this.value != null;
  };

  isEmpty() {
    return !this.isDefined();
  }

  toArray() {
    if (this.isDefined()) {
      return [this.value];
    } else {
      return [];
    }
  }

  map<B>(f: (a: A)=>B) {
    if (this.isDefined())
      return new Optional(this.toArray().map(x=>f(x)));
    else
      return <Optional<B>><any><Optional<A>>this;
  }

  forEach(f: (a: A)=>void) {
    this.toArray().forEach(x=>f(x));
  }

  useOrElse(f: (a: A)=>void, g: ()=>void) {
    if (this.isDefined())
      f(this.value);
    else
      g();
  }
}
function some<A>(x: A): Optional<A> {
  return new Optional<A>(x);
}
function someFromArray<A>(xs: A[]): Optional<A> {
  if (xs.length == 0)
    return none<A>();
  else if (xs.length == 1)
    return some<A>(xs[0]);
  else throw new Error('more than one value');
}
function none<A>(): Optional<A> {
  return new Optional<A>(void 0);
}
function wrap<A>(x: A) {
  return ()=>x;
}
function newId(): number {
  let lastUid = get(StorageKey.lastUid, wrap(0));
  let res = lastUid + 1;
  set(StorageKey.lastUid, res);
  return res;
}
function getQueryVar(name: string): string[] {
  return location.search.substring(1)
    .split('&')
    .map(s=>s
      .split('=')
      .map(decodeURIComponent)
    )
    .filter(p=>p[0] == name)
    .map(p=>p[1])
}
/* -------------------- end utils ----------------------*/

enum AppStatus{
  init, upgrade, ready
}

declare let runTime: any;
if (!('runTime' in window)) {
  window[<number><any>'runTime'] = <Window>{};
}

function init() {
  console.log('begin init');
  if (runTime[app_name]) {
    console.warn(app_name + ' already running, reload the page to stop the previous instance');
    return;
  }
  let last_version = get(StorageKey.app_version, wrap(''));
  let current_version = app_name + '-' + app_version;
  if (last_version != '' && last_version != current_version) {
    /* remove old version, restart the automater */
    Object.keys(StorageKey)
      .forEach(x=>localStorage.removeItem(x));
    init();
    return;
  } else {
    /* same version, resume the automater */
    set(StorageKey.app_version, current_version);
    runTime[app_name] = true;
  }
  set(app_name, AppStatus.init);

  /* for debug from console manually */
  let url = 'https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js';
  let script = document.createElement('script');
  script.src = url;
  script.onload = loop;
  document.head.appendChild(script);

  console.log('end init');
}

enum TaskType{
  find_task,
  check_building_list,
  check_resource,
  find_upgrade_farm,
  upgrade_farm,
  trade,
}

namespace StorageKey {
  export const app_version = 'app_version';
  export const task_id_stack = 'task_id_stack';
  export const resource = 'resource';
  export const lastUid = 'last_uid';
  export const task_map = 'task_map';
}
class Task {
  pathname: string;
  id: number;
  type: TaskType;

  nextTask: Optional<Task>;
  waiting_child = false;

  run(callback: Function) {
    console.error('task run not impl', this);
    throw new Error('run not impl');
  }

  runAll(callback: Function) {
    console.log('begin runAll, run', this);
    this.run(()=> {
      console.log('end run', this);
      console.log('begin runAll nextTask', this);
      this.nextTask.forEach(x=>x.runAll(callback));
      console.log('end runAll nextTask', this);
    });
  }

  constructor(data?: any) {
    Object.assign(this, data);
    if (!isDefined(this.id)) {
      this.id = newId();
    }
    if (this.nextTask && this.nextTask.value) {
      console.log('wrap nextTask', this.nextTask);
      Object.setPrototypeOf(this.nextTask, Optional.prototype);
    } else {
      this.nextTask = new Optional<Task>();
    }
  }

  store() {
    let kv: any = getOrSetDefault(StorageKey.task_map, wrap({}));
    kv[this.id] = this;
    set(StorageKey.task_map, kv);
  }

  remove() {
    localStorage.removeItem(this.id + "");
  }

  static load(id: number): Task {
    console.log('load Task-' + id);
    let kv: any = get(StorageKey.task_map, ()=> {
    });
    if (kv[id]) {
      // return new Task(kv[id]);
      return Tasks.list.find(x=>x.id == id);
    } else
      throw new Error("Task-" + id + " not found!")
  }
}
module Tasks {
  export const list: Task[] = [];

  export const findTask = new Task();
  list.push(findTask);
  findTask.type = TaskType.find_task;
  findTask.run = (cb)=> {
    console.log('begin run findTask');

    /* check for login */
    if ($('.loginTable').length > 0) {
      $('.account').find('input').val(config.username);
      $('.pass').find('input').val(config.password);
      $('[type=submit]').click();
      return;
    }

    pushStack(check_building_list.id);
    cb();
  };

  export const trade = new Task();
  list.push(trade);
  trade.type = TaskType.trade;
  trade.pathname = "/hero_auction.php";
  trade.run = ()=> {

  };

  export const check_building_list = new Task();
  list.push(check_building_list);
  check_building_list.type = TaskType.check_building_list;
  trade.run = (cb)=> {
    console.log('begin run check_building_list');
    if (location.pathname != '/dorf1.php' && location.pathname != '/dorf2.php') {
      location.replace('/dorf1.php');
      return;
    }
    console.log('find building list');
    let res = $('.buildingList')
        .find('.buildDuration')
        .val()
      ;
    console.log(res);
    cb();
  };

  list.forEach(task=>task.store());
}


/* -------------- begin task id stack ------------ */
function getStack(): number[] {
  return get(StorageKey.task_id_stack, ()=>[]);
}
function storeStack(xs: number[]) {
  set(StorageKey.task_id_stack, xs);
}
function pushStack(id: number) {
  let xs = getStack();
  xs.push(id);
  storeStack(xs);
}
function popStack(): Optional<number> {
  let xs = getStack();
  let res = xs.pop();
  storeStack(xs);
  return some(res);
}
function getTopTask(): Optional<number> {
  return some(getStack()[0]);
}
/* -------------- end task id stack ------------ */

function loop() {
  function next() {
    let task_id = last(getStack());
    if (!isDefined(task_id)) {
      console.log('no task');
      task_id = Tasks.findTask.id;
      pushStack(task_id);
    }
    let task = Task.load(task_id);
    console.log('begin runAll', task);
    task.runAll(()=> {
      console.log('end run', task);
      let stack = getStack();
      if (stack.pop() == task.id) {
        /* the current task has finished and no child task created by this task */
        storeStack(stack);
      } else {
        /* this task created subtask */
        task.waiting_child = true;
        task.store();
      }
      setTimeout(next);
      console.log('end runAll', task);
    });
  }

  setTimeout(next)
}

init();
