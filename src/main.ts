import {defer} from '../lib/jslib/es6/dist/es6/src/utils-es6';
import {config} from './config';
import {isNumber} from '../lib/jslib/es5/dist/utils-es5';

declare function $(s: string): HTMLCollection;

namespace ItemKeys {
  export const lastid = 'lastid';
  export const building_task_list = 'building_task_list';
  export const farm_info = 'farm_info';
  export const quest_info = 'quest_info';
}

/* 10 second */
const expire_period = 10000;

function isDefined(o: any) {
  return !(typeof o === 'undefined' || o == null);
}

function notDefined(o: any) {
  return (typeof o === 'undefined' || o == null);
}

function id<A>(a: A): ()=>A {
  return ()=>a;
}

function has(key: string) {
  return isDefined(localStorage[key]);
}

function getOrElse<A>(key: string, fallback: ()=>A) {
  if (has(key))
    return JSON.parse(localStorage[key]);
  else
    return fallback();
}

function store(key: string, value: any) {
  console.log('store', key, value);
  localStorage[key] = JSON.stringify(value);
}

function newId(): number {
  let last = getOrElse(ItemKeys.lastid, id(0));
  store(ItemKeys.lastid, last + 1);
  return last + 1;
}

class Item<A> {
  name: string;
  id: number;
  createTime: number;
  data: A;
  expire_period = expire_period;
  expire_date: number;

  constructor(data?: any) {
    Object.assign(this, data);
    if (notDefined(this.id)) {
      this.id = newId();
    }
    if (notDefined(this.createTime)) {
      this.createTime = Date.now();
    }
    if (notDefined(this.expire_date)) {
      this.expire_date = this.createTime + this.expire_period;
    }
  }

  store() {
    store(this.name, this)
  }

  static load<A>(name: string, prototype: any): Item<A> {
    let x = getOrElse(name, ()=> {
      throw new Error('Item ' + name + ' not found')
    });
    Object.setPrototypeOf(x, prototype);
    return x;
  }
}
function init() {
  console.log('begin init');
  if (typeof jQuery === 'undefined') {
    let s = document.createElement('script');
    s.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js';
    let ori$ = window[<number><any>'$'];
    s.onload = ()=> {
      window[<number><any>'$'] = ori$;
      main();
    };
    document.head.appendChild(s);
  } else {
    setTimeout(main);
  }
  console.log('end init');
}

init();

function isInPage(...filenames: string[]) {
  return filenames.some(filename=>location.pathname == '/' + filename);
}

class BuildingTask {
  buildingName: string;
  buildingLevel: number;
  buildDuration: number;
  finishTime: number;
}
function find_building_task_list(cb: Function) {
  const $ = jQuery;
  console.log('find building task list');
  if (isInPage('dorf1.php', 'dorf2.php')) {
    let res = new Item<BuildingTask[]>();
    res.data = $('.buildingList')
      .find('li')
      .map((i, e)=> {
        let res = new BuildingTask();
        res.buildingName = $(e).find('.name').text().split('\t').filter(x=>x.length > 0)[1];
        res.buildingLevel = $(e).find('.lvl').text().split(' ').filter(isNumber).map(x=>+x)[0];
        res.buildDuration = +$(e).find('span.timer').attr('value');
        res.finishTime = Date.now() + res.buildDuration;
        // console.log('building task', res);
        return res;
      }).toArray();
    if (res.data.length > 0) {
      res.expire_period = res.data.map(x=>x.buildDuration).reduce((acc, c)=>Math.max(acc, c));
      res.expire_date = res.data.map(x=>x.finishTime).reduce((acc, c)=>Math.max(acc, c));
    }
    console.log('building task list', res.data);
    store(ItemKeys.building_task_list, res);
    cb();
  } else {
    location.replace('dorf1.php')
  }
}

class Farm {
  name: string;
  level: number;
}

function find_farm_info(cb: Function) {
  const $ = jQuery;
  if (isInPage('dorf1.php')) {
    let res = new Item<Farm[]>();
    res.data = jQuery('map').find('area')
      .filter((i, e)=>$(e).attr('href').includes('build'))
      .map((i, e)=> {
        let xs = $(e).attr('alt').split(' ');
        let res = new Farm();
        res.name = xs[0];
        res.level = +xs[2];
        return res;
      })
      .toArray();
    console.log('farms', res.data);
    store(ItemKeys.farm_info, res);
  } else {
    location.replace('dorf1.php');
  }
}

function find_quest_info(cb: Function) {
  const $ = jQuery;
  console.log('find quest info');
  let e = $('.questButtonOverviewAchievements');
  console.log('quest button', e);
  e.click();
}

function main() {
  login() && setTimeout(findTask);
}

function login(): boolean {
  const $ = jQuery;
  let res = $('.loginBox');
  console.log('check login', res.length);
  if (res.length == 0) {
    return true;
  }
  res.find('.account').find('input').val(config.username);
  res.find('.pass').find('input').val(config.password);
  res.find('[type=submit]').click();
  return false;
}

function findTask() {
  console.log('find task');
  let xs: string[] = Object.keys(ItemKeys)
      .filter(x=>x != ItemKeys.lastid)
      .filter(x=> {
        return !has(x) || (
            Item.load(x, Item.prototype).expire_date < Date.now()
          );
      })
    ;
  if (xs.length == 0) {
    console.log('no task');
  } else {
    let name: string = xs[0];
    switch (name) {
      case ItemKeys.building_task_list:
        return find_building_task_list(findTask);
      case ItemKeys.farm_info:
        return find_farm_info(findTask);
      case ItemKeys.quest_info:
        return find_quest_info(findTask);
      default:
        console.error('not impl', name);
    }
  }
}
