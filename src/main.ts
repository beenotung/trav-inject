import {config} from './config';
import {isNumber, Random, noop} from '../lib/jslib/es5/dist/utils-es5';
import {require as JSRequire} from '../lib/jslib/es6/dist/es6/src/utils-es6'

declare function $(s: string): HTMLCollection;

namespace ItemKeys {
  export const lastid = 'lastid';
  export const is_doing_user_task = 'is_doing_user_task';
  export const user_task_name = 'user_task_name';
  export const user_task_step = 'user_task_step';
  export const exec_user_task = 'exec_user_task';
  export const building_task_list = 'building_task_list';
  export const farm_info = 'farm_info';
  export const production_info = 'production_info';
  export const hero_advance_info = 'hero_advance_info';
  export const exec_hero_advance_info = 'exec_hero_advance_info';
  export const build_target_farm = 'build_target_farm';
  export const exec_build_target_farm = 'exec_build_target_farm';
  // export const quest_info = 'quest_info';
}
// Object.keys(ItemKeys).forEach(x=>unsafe.set(ItemKeys, x, x));

namespace window_keys {
  export const ajaxToken = 'ajaxToken'
}

let non_expire_item_keys = [
  ItemKeys.lastid
  , ItemKeys.is_doing_user_task
  , ItemKeys.user_task_name
  , ItemKeys.user_task_step
];

/* time to refetch the Item from webpage into localStorage */
const default_expire_period = 1000 * 30 * 60;

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

function getOrElse<A>(key: string, fallback: ()=>Item<A>): Item<A> {
  if (has(key))
    return JSON.parse(localStorage[key]);
  else
    return fallback();
}

function store<A>(name: string, item: Item<A>) {
  console.log('store', name, item);
  if (item.name != name) {
    console.warn('storing item, but name does not match, overriding item name');
    item.name = name;
  }
  localStorage[name] = JSON.stringify(item);
}

function newId(): number {
  let last = localStorage[ItemKeys.lastid];
  if (!Number.isInteger(last))
    last = 0;
  localStorage[ItemKeys.lastid] = +last + 1;
  return last + 1;
}

function last<A>(xs: A[]): A {
  return xs[xs.length - 1];
}

function groupBy<A>(f: (a: A)=>number, as: A[]): {[id: number]: A[]} {
  let res: {[id: number]: A[]} = {};
  as.forEach(a=> {
    let i = f(a);
    if (res[i]) {
      res[i].push(a);
    } else {
      res[i] = [a];
    }
  });
  return res;
}

function obj_to_array(o: any): Array<[string,any]> {
  return Object.keys(o)
    .map(k=> {
      let res: [string,any] = [k, o[k]];
      return res;
    });
}

function str_to_int(s: string): number {
  return +s.split('').filter(x=>
    x == '0'
    || x == '1'
    || x == '2'
    || x == '3'
    || x == '4'
    || x == '5'
    || x == '6'
    || x == '7'
    || x == '8'
    || x == '9'
    || x == ','
    || x == '-'
  ).reduce((acc, c)=> {
    if (c == ',')
      return acc;
    else
      return acc + c;
  });
}

/**
 * @param x : string, example: (1|-1)
 * @return number[], example: [1,-1]
 * */
function str_to_xy(s: string) {
  if (s[0] == '(' && s[s.length - 1] == ')')
    s = s.substr(1, s.length - 2);
  return s.split('|')
    .map(str_to_int);
}

function wrapLocalStorage(name: string): (o?: any)=>any {
  return function () {
    let res: string;
    if (arguments.length == 0) {
      res = localStorage[name];
    } else if (arguments.length == 1) {
      res = localStorage[name];
      localStorage[name] = JSON.stringify(arguments[0]);
    } else {
      throw new Error("Illegal argument: " + JSON.stringify(arguments));
    }
    try {
      return JSON.parse(res);
    } catch (e) {
      return res;
    }
  }
}

function single(single: any[]): any {
  if (single.length == 1) {
    return single[0];
  } else {
    let message = 'argument is not an single array';
    console.error(message, {input: single});
    throw new Error(message);
  }
}

module unsafe {
  export function get(o: any, k: number|string): any {
    return o[k];
  }

  export function wrap(o: any) {
    function set(k: number|string, v: any) {
      o[k] = v;
      return set;
    }

    function get(k: number|string) {
      return o[k];
    }

    return {set: set, get: get};
  }

  export function set(o: any, k: number|string, v: any) {
    return wrap(o)
      .set(k, v);
  }

  export function array_includes(array: any[], v: any): boolean {
    return get(array, 'includes').call(array, v);
  }

  export function newObject<A>(constructor: any): (o: any)=>A {
    return o=>new constructor(o);
  }
}

class Item<A> {
  name: string;
  id: number;
  createTime: number;
  data: A;
  expire_period: number;
  expire_date: number;

  constructor(data?: any) {
    Object.assign(this, data);
    if (notDefined(this.id)) {
      this.id = newId();
    }
    if (notDefined(this.createTime)) {
      this.createTime = Date.now();
    }
    if (notDefined(this.expire_period)) {
      this.expire_period = default_expire_period;
    }
    if (notDefined(this.expire_date)) {
      this.expire_date = this.createTime + this.expire_period;
    }
  }

  store() {
    store(this.name, this)
  }

  static load<A>(name: string, prototype?: any, isArray = false): Item<A> {
    let error = new Error('Item ' + name + ' not found');
    let item = getOrElse<A>(name, ()=> {
      console.error(error);
      /* cannot just throw the Error, webpack-typescript cannot understand this :( */
      return null;
    });
    if (item == null) {
      throw error;
    }
    if (item.name != name) {
      console.warn('loading item, but name does not match, overriding item name');
      item.name = name;
    }
    Object.setPrototypeOf(item, Item.prototype);
    if (prototype) {
      if (isArray) {
        Object.setPrototypeOf(item.data, Array.prototype);
        (<any[]><any>item.data).forEach(x=>Object.setPrototypeOf(x, prototype));
      } else {
        Object.setPrototypeOf(item.data, prototype);
      }
    }
    console.log('loaded Item', item);
    return item;
  }
}

function clear_user_task() {
  localStorage.removeItem(ItemKeys.is_doing_user_task);
  localStorage.removeItem(ItemKeys.user_task_name);
  let t = new Item();
  t.expire_period = Math.pow(2, 100);
  t.expire_date = Date.now() + t.expire_period;
  store(ItemKeys.exec_user_task, t);
}

function DOMInit() {
  const $ = jQuery;

  function add_button(text: string, cb: (ev: MouseEvent)=>any) {
    let resetBtn = document.createElement('button');
    resetBtn.textContent = text;
    resetBtn.style.border = '1px white solid';
    resetBtn.style.background = 'lightgrey';
    resetBtn.style.color = 'black';
    resetBtn.style.fontWeight = 'bold';
    resetBtn.style.padding = '4px';
    resetBtn.onclick = cb;
    // document.body.appendChild(resetBtn);
    $('#pageLinks').prepend(resetBtn);
  }

  add_button('15-rice', ()=> {
    let coor: string = jQuery('#sidebarBoxVillagelist').find('.coordinates').first().text();
    let xy = str_to_xy(coor);
    api.get_map_data(xy[0], xy[1], 3, (tiles: api.Tile[])=> {
      // console.log({tiles: tiles});
      let report_html = 'center: ' + xy[0] + '|' + xy[1] + '<hr>';
      report_html += tiles.filter((x: api.Tile)=>x.is_free_village).filter(x=>x.farms[3] == 15)
        .sort((a, b)=> {
          let da = Math.abs(xy[0] - a.x) + Math.abs(xy[1] - a.y);
          let db = Math.abs(xy[0] - b.x) + Math.abs(xy[1] - b.y);
          return da == db ? 0 :
            da < db ? -1 : 1;
        })
        .map(x=>
          '<a href="http://tx3.travian.tw/position_details.php?x=' + x.x + '&y=' + x.y + '">' + x.x + '|' + x.y + '</a>'
        ).join('<br>');
      let div = document.createElement('div');
      div.innerHTML = report_html;
      document.body.appendChild(div);
      $(div).dialog();
    });
  });

  add_button('reset inject tool', ()=> {
    Object.keys(ItemKeys).forEach(x=>localStorage.removeItem(x));
    location.reload(true);
  });

  function activate_user_task(task_name: string) {
    localStorage[ItemKeys.is_doing_user_task] = true;
    localStorage[ItemKeys.user_task_name] = task_name;
    let t = new Item();
    t.expire_period = 0;
    t.expire_date = -1;
    store(ItemKeys.exec_user_task, t);
    exec_user_task(noop);
  }

  {
    let container = $('.forwardBackward');
    if (container.length > 0) {
      let a = $('<a style="float: none;padding: 15px">rub</a>');
      container.append(a);
      a.click(()=>activate_user_task(RubTask.name));
    }
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
      JSRequire.load('http://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css', false, true, eval);
      JSRequire.load('https://jqueryui.com/resources/demos/style.css', false, true, eval);
      // require.load('https://code.jquery.com/jquery-1.12.4.js');
      JSRequire.load('https://code.jquery.com/ui/1.12.1/jquery-ui.js', false, true, eval);
      main();
    };
    document.head.appendChild(s);
  } else {
    setTimeout(main);
  }
  console.log('end init');
}

setTimeout(init, Random.nextInt(250, 750));

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
  console.log('running find_building_task_list');
  if (isInPage('dorf1.php', 'dorf2.php')) {
    let res = new Item<BuildingTask[]>();
    res.data = $('.buildingList')
      .find('li')
      .map((i, e)=> {
        let res = new BuildingTask();
        res.buildingName = $(e).find('.name').text().split('\t').filter(x=>x.length > 0)[1];
        res.buildingLevel = $(e).find('.lvl').text().split(' ').filter(isNumber).map(x=>+x)[0];
        res.buildDuration = +$(e).find('span.timer').attr('value') * 1000;
        res.finishTime = Date.now() + res.buildDuration;
        // console.log('building task', res);
        return res;
      }).toArray();
    if (res.data.length > 0) {
      res.expire_period = res.data.map(x=>x.buildDuration).reduce((acc, c)=>Math.max(acc, c));
      res.expire_date = res.data.map(x=>x.finishTime).reduce((acc, c)=>Math.max(acc, c));
    }
    // console.log('building task list', res.data);
    store(ItemKeys.building_task_list, res);
    cb();
  } else {
    location.replace('dorf1.php')
  }
}
class Farm {
  id: number;
  name: string;
  level: number;
  /* 0..3 */
  farm_type: number;
  not_now: boolean;
  under_construct: boolean;

  pathname() {
    return 'build.php?id=' + this.id;
  }
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
        res.id = i + 1;
        res.name = xs[0];
        res.level = +xs[2];
        return res;
      })
      .toArray();
    jQuery('#village_map').find('.level')
      .each((i, e)=> {
        let $e = $(e);
        let classStr = $e.attr('class');
        let level = last(classStr.split('level'));
        if (+level != res.data[i].level) {
          throw new Error('farm not matching');
        }
        res.data[i].not_now = classStr.includes('notNow');
        res.data[i].under_construct = classStr.includes('underConstruction');
        res.data[i].farm_type = classStr.split(' ').filter(x=>x.includes('gid')).map(x=>+x.replace('gid', ''))[0] - 1;
      });
    console.log('farms', res.data);
    store(ItemKeys.farm_info, res);
    cb();
  } else {
    location.replace('dorf1.php');
  }
}
class ProductionInfo {
  warehouse_size: number;
  granary_size: number;
  produce_rate: number[];
  amount: number[];
  storage_capacity: number[];
  time_to_full: number[];
}
function find_production_info(cb: Function) {
  console.log('find production info');
  const $ = jQuery;
  let res = new ProductionInfo();
  if (isInPage('dorf1.php')) {
    res.produce_rate = jQuery('table#production').find('td.num')
      .map((i, e)=> {
        return str_to_int($(e).text());
      })
      .toArray();
    let stocks = $('.stock')
      .map((i, e)=>str_to_int($(e).text()))
      .toArray();
    res.warehouse_size = stocks[0];
    res.granary_size = stocks[1];
    res.storage_capacity = [
      res.warehouse_size
      , res.warehouse_size
      , res.warehouse_size
      , res.granary_size
    ];
    res.amount = jQuery('#stockBar').find('.stockBarButton').find('span')
      .map((i, e)=>str_to_int($(e).text()))
      .toArray();
    res.time_to_full = res.storage_capacity.map((cap, i)=> {
      return (cap - res.amount[i]) / (res.produce_rate[i] ) * 3600 * 1000;
    });
    let item = new Item<ProductionInfo>();
    item.data = res;
    store(ItemKeys.production_info, item);
    cb();
  } else {
    location.replace('dorf1.php');
  }
}

namespace HeroStatus {
  export const in_home = 'in_home';
  export const advance_out = 'advance_out';
  export const attack_out = 'attack_out';
  export const move_in = 'move_in';
}
class HeroAdvanceInfo {
  numberOfAdvance: number;
  heroStatus: string;
}

function find_hero_advance_info(cb: Function) {
  const $ = jQuery;
  console.log('find hero advance info');
  let res = new Item<HeroAdvanceInfo>();
  res.data = new HeroAdvanceInfo();
  /* find status */
  let $heroStatusMessage = $('.heroStatusMessage');
  let statusClass = $heroStatusMessage
    .find('img')
    .attr('class');
  switch (statusClass) {
    case 'heroStatus100':
      res.data.heroStatus = HeroStatus.in_home;
      break;
    case 'heroStatus50':
      res.data.heroStatus = HeroStatus.advance_out;
      break;
    case 'heroStatus9':
      res.data.heroStatus = HeroStatus.move_in;
      break;
    case 'heroStatus4':
      res.data.heroStatus = HeroStatus.attack_out;
      break;
    default:
      throw new Error('not identifiable hero status <' + statusClass + '> : ' + $heroStatusMessage.text())
  }
  /* find number of advance */
  res.data.numberOfAdvance = +$('.adventureWhite')
    .find('.speechBubbleContent')
    .text();
  console.log('hero advance info', res.data);
  store(ItemKeys.hero_advance_info, res);
  cb();
}

function exec_hero_advance_info(cb: Function) {
  const $ = jQuery;
  let itemHeroAdvanceInfo = Item.load<HeroAdvanceInfo>(ItemKeys.hero_advance_info);
  let heroAdvanceInfo = itemHeroAdvanceInfo.data;
  let res = new Item<number>();
  res.name = ItemKeys.exec_hero_advance_info;
  if (heroAdvanceInfo.heroStatus == HeroStatus.in_home && heroAdvanceInfo.numberOfAdvance > 0) {
    console.log('directing hero to go advance');
    if (!isInPage('hero_adventure.php', 'start_adventure.php')) {
      location.replace('/hero_adventure.php');
      return;
    } else {
      if (isInPage('hero_adventure.php')) {
        let res = jQuery('#adventureListForm').find('tr').find('a.gotoAdventure');
        console.log('res', res);
        res[0].click();
        return;
      } else {
        let btnSend = jQuery('form.adventureSendButton').find('button[type=submit]');
        if (btnSend.length > 0) {
          // TODO get advance time
          res.store();
          btnSend.click();
        } else {
          location.replace('dorf1.php');
          cb();
        }
      }
    }
  } else {
    console.log('hero cannot move, skip');
    res.store();
    cb();
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
  DOMInit();
  login() && init_var() && setTimeout(findTask);
}

function login(): boolean {
  const $ = jQuery;
  let res = $('.loginTable');
  console.log('check login', res.length);
  if (res.length == 0) {
    return true;
  }
  res.find('.account').find('input').val(config.username);
  res.find('.pass').find('input').val(config.password);
  res.find('[type=submit]').click();
  return false;
}

function init_var() {
  /* init local storage and global vars */
  return true;
}
namespace UserTask {
}
class RubTask {
  total_res: number[];
  hill: number;
  target_res: number;
}
function exec_user_task(cb: Function) {
  const $ = jQuery;
  console.log('exec user task');
  let user_task_step = wrapLocalStorage(ItemKeys.user_task_step);
  if (localStorage[ItemKeys.is_doing_user_task] && user_task_step()) {
    console.log('user task step: ' + user_task_step());
    if (isInPage('berichte.php')) {
      let res = new RubTask();
      console.log(0);
      let $goods = $('table#attacker').find('.goods');
      res.total_res = [];
      res.total_res[0] = str_to_int($goods.find('.r1').parent().text());
      res.total_res[1] = str_to_int($goods.find('.r2').parent().text());
      res.total_res[2] = str_to_int($goods.find('.r3').parent().text());
      res.total_res[3] = str_to_int($goods.find('.r4').parent().text());
      res.hill = str_to_int($goods.find('.gebIcon').parent().text());
      res.target_res = res.total_res.map(x=>Math.max(0, x - res.hill)).reduce((a, b)=>a + b);
      console.log(res);
      wrapLocalStorage(RubTask.name)(res);
      location.replace($('table').filter((i, e)=>e.id != 'attacker').find('.troopHeadline').find('a').last().attr('href'));
    } else if (isInPage('position_details.php')) {
      console.log('in position details page');
      location.replace(jQuery('div.option').find('a').filter((i, e)=>$(e).attr('href').includes('build.php?id=39')).attr('href'));
    } else if (isInPage('build.php') && location.search.substring(1).split('&').filter(x=>x.includes('id=39')).length == 1) {
      jQuery('div.option').find(':radio[value=4]').click();
      let res: RubTask = wrapLocalStorage(RubTask.name)();

      function number_of_unit(unit_class: string, count?: number) {
        if (count == void 0) {
          return str_to_int($('#troops').find('.unit.' + unit_class).parent().find('a').text());
        } else {
          $('#troops').find('.unit.u1').parent().find('input').val(count);
        }
      }

      let n_u1 = number_of_unit('u1');
      let p_u1 = 100.0 * n_u1 * 50 / res.target_res;
      if (p_u1 >= 80) {
        if (p_u1 > 120)
          number_of_unit('u1', Math.round(res.target_res / 50 * 1.2));
        else
          number_of_unit('u1', Math.round(n_u1));
      } else {
        console.log('not enough u1, only has ' + p_u1 + '%');
      }
      clear_user_task();
    } else {
      throw new Error('Invalid step: ' + JSON.stringify(user_task_step()))
    }
  } else {
    clear_user_task();
    cb();
  }
}

function findTask() {
  console.log('find task');
  let xs: string[] = Object.keys(ItemKeys)
      .filter(x=> non_expire_item_keys.indexOf(x) == -1)
      .filter(x=> {
        return !has(x) || (
            Item.load(x).expire_date < Date.now()
          );
      })
    ;
  if (xs.length == 0) {
    console.log('no task');
  } else {
    let name: string = xs[0];
    console.log('found task', name);
    switch (name) {
      case ItemKeys.exec_user_task:
        return exec_user_task(findTask);
      case ItemKeys.building_task_list:
        return find_building_task_list(findTask);
      case ItemKeys.farm_info:
        return find_farm_info(findTask);
      case ItemKeys.production_info:
        return find_production_info(findTask);
      case ItemKeys.hero_advance_info:
        return find_hero_advance_info(findTask);
      case ItemKeys.exec_hero_advance_info:
        return exec_hero_advance_info(findTask);
      case ItemKeys.build_target_farm:
        return find_build_target_farm(findTask);
      case ItemKeys.exec_build_target_farm:
        return exec_build_target_farm(findTask);
      // case ItemKeys.quest_info:
      //   return find_quest_info(findTask);
      default:
        console.error('not impl', name);
    }
  }
}

function find_build_target_farm(cb: Function) {
  const $ = jQuery;
  console.log('find_build_target_farm');
  let buildingTasksItem = Item.load<BuildingTask[]>(ItemKeys.building_task_list, BuildingTask.prototype, true);
  let buildingTasks: BuildingTask[] = buildingTasksItem.data;
  let farms: Farm[] = Item.load<Farm[]>(ItemKeys.farm_info).data.filter((farm: Farm)=>!farm.not_now);
  let production_info: ProductionInfo = Item.load<ProductionInfo>(ItemKeys.production_info, ProductionInfo.prototype).data;
  let farmss: {[idx: number]: Farm[]} = groupBy(farm=>farm.farm_type, farms.filter(x=>!x.not_now));
  let item = new Item<Farm>();
  try {
    let farm = obj_to_array(farmss)
      .map((e: [string,Farm[]])=>[+e[0], e[1]])
      .map((e: [number,Farm[]])=> {
        let farms: Farm[] = e[1];
        return farms.reduce((acc, c)=> {
          if (acc.level < c.level)
            return acc;
          else
            return c;
        })
      })
      .reduce((acc, c)=> {
        if (production_info.time_to_full[acc.farm_type] < production_info.time_to_full[c.farm_type]) {
          return c;
        }
        else {
          return acc;
        }
      });
    Object.setPrototypeOf(farm, Farm.prototype);
    console.log('selected farm', farm);
    item.data = farm;
  } catch (e) {
    console.log('no farm available to upgrade');
    item.data = new Farm();
    item.data.id = -1;
    console.log('buildingTasks', buildingTasks);
    if (buildingTasks.length > 0)
      item.expire_date = buildingTasks.reduce((acc, c)=> {
        if (acc.finishTime > c.finishTime)
          return c;
        else
          return acc;
      }).finishTime;
    if (item.expire_date < Date.now()) {
      buildingTasksItem.expire_date = -1;
      buildingTasksItem.store();
      item.expire_date = -1;
    }
  }
  store(ItemKeys.build_target_farm, item);
  cb();
}

function exec_build_target_farm(cb: Function) {
  console.log('exec_build_target_farm');
  let srcItem = Item.load<Farm>(ItemKeys.build_target_farm, Farm.prototype);
  let farm: Farm = srcItem.data;
  let resItem = new Item<Farm>();
  resItem.data = farm;
  if (farm.id == -1) {
    console.log('no available farm to upgrade ');
    resItem.expire_date = Item.load<BuildingTask[]>(ItemKeys.building_task_list).data
      .reduce((acc, c)=> {
        if (acc.finishTime > c.finishTime)
          return c;
        else
          return acc;
      }).finishTime;
    store(ItemKeys.exec_build_target_farm, resItem);
    cb();
  } else {
    Object.setPrototypeOf(farm, Farm.prototype);
    console.log('check if in building page');
    if (location.pathname != '/build.php' || location.search != '?id=' + farm.id) {
      console.log('not in building page', farm.pathname());
      location.replace(farm.pathname());
      return;
    }
    console.log('already in building page');
    console.log('going to build', farm.name, 'level', farm.level);
    let $container = jQuery('.showBuildCosts.normal');
    let $time = $container.find('span');
    if ($container.length == 0) {
      $container = jQuery('div.contentContainer').find('#build');
      $time = $container.find('span.clocks');
    }
    let times = $time.text().split(':').map(str_to_int);
    let time = (times[0] * 3600 + times[1] * 60 + times[2]) * 1000;
    resItem.expire_period = time;
    resItem.expire_date = Date.now() + time;
    store(ItemKeys.exec_build_target_farm, resItem);
    srcItem.expire_date = -1;
    srcItem.store();
    $container.find('button').click();
  }
}

module api {
  export const translate = {
    "allgemein.ok": "確定",
    "allgemein.cancel": "取消",
    "allgemein.anleitung": "遊戲教學",
    "allgemein.close": "關閉",
    "cropfinder.keine_ergebnisse": "沒有合要求的搜尋結果",
    "k.spieler": "玩家：",
    "k.einwohner": "人口：",
    "k.allianz": "公會：",
    "k.volk": "種族：",
    "k.dt": "村莊",
    "k.bt": "已被佔領的綠州",
    "k.fo": "未被佔領的綠州",
    "k.vt": "荒廢的土地",
    "k.regionTooltip": "地區:",
    "k.loadingData": "載入中…",
    "a.v1": "羅馬人",
    "a.v2": "條頓人",
    "a.v3": "高盧人",
    "a.v4": "自然界",
    "a.v5": "賴達族",
    "k.f1": "3-3-3-9",
    "k.f2": "3-4-5-6",
    "k.f3": "4-4-4-6",
    "k.f4": "4-5-3-6",
    "k.f5": "5-3-4-6",
    "k.f6": "1-1-1-15",
    "k.f7": "4-4-3-7",
    "k.f8": "3-4-4-7",
    "k.f9": "4-3-4-7",
    "k.f10": "3-5-4-6",
    "k.f11": "4-3-5-6",
    "k.f12": "5-4-3-6",
    "k.f99": "賴達村莊",
    "b.ri1": "攻擊者獲得勝利且並無任何損失",
    "b.ri2": "攻擊者獲得勝利，但有損失",
    "b.ri3": "攻擊者戰敗了",
    "b.ri4": "防禦者獲得勝利且並無任何損失",
    "b.ri5": "防禦者獲得勝利，但有損失",
    "b.ri6": "防禦者戰敗了",
    "b.ri7": "防禦者戰敗了但無任何損失",
    "b:ri1": "<img src=\"img/x.gif\" class=\"iReport iReport1\"/>",
    "b:ri2": "<img src=\"img/x.gif\" class=\"iReport iReport2\"/>",
    "b:ri3": "<img src=\"img/x.gif\" class=\"iReport iReport3\"/>",
    "b:ri4": "<img src=\"img/x.gif\" class=\"iReport iReport4\"/>",
    "b:ri5": "<img src=\"img/x.gif\" class=\"iReport iReport5\"/>",
    "b:ri6": "<img src=\"img/x.gif\" class=\"iReport iReport6\"/>",
    "b:ri7": "<img src=\"img/x.gif\" class=\"iReport iReport7\"/>",
    "b:bi0": "<img class=\"carry empty\" src=\"img/x.gif\" alt=\"收獲\" />",
    "b:bi1": "<img class=\"carry half\" src=\"img/x.gif\" alt=\"收獲\" />",
    "b:bi2": "<img class=\"carry\" src=\"img/x.gif\" alt=\"收獲\" />",
    "a.r1": "木材",
    "a.r2": "磚塊",
    "a.r3": "鋼鐵",
    "a.r4": "穀物",
    "a.atm69": "冒險編號 69",
    "a.ad": "難度：",
    "a.ad0": "困難",
    "a.ad1": "普通",
    "a.ad2": "普通",
    "a.ad3": "普通",
    "a:r1": "<img alt=\"木材\" src=\"img/x.gif\" class=\"r1\">",
    "a:r2": "<img alt=\"磚塊\" src=\"img/x.gif\" class=\"r2\">",
    "a:r3": "<img alt=\"鋼鐵\" src=\"img/x.gif\" class=\"r3\">",
    "a:r4": "<img alt=\"穀物\" src=\"img/x.gif\" class=\"r4\">",
    "k.arrival": "到達",
    "k.ssupport": "增援",
    "k.sspy": "偵察",
    "k.sreturn": "退回",
    "k.sraid": "搶奪",
    "k.sattack": "攻擊",
    "answers.world_07b_title": "Travian Answers",
    "answers.world_16_title": "Travian Answers",
    "hero_collapsed": "顯示更多資料",
    "hero_expanded": "隱藏資料",
    "infobox_collapsed": "顯示更多訊息",
    "infobox_expanded": "隱藏訊息 | 標記所有訊息已讀",
    "villagelist_collapsed": "顯示座標",
    "villagelist_expanded": "隱藏座標"
  };
  export class Tile {
    c: string;
    t: string;
    x: number;
    y: number;
    is_free_greenland: boolean;
    is_free_village: boolean;
    farms: number[];

    constructor(raw: any) {
      Object.assign(this, raw);
      this.x *= 1;
      this.y *= 1;
      if (this.c) {
        let cs = this.c.split(' ').map(x=>x.substr(1, x.length - 2));
        this.is_free_greenland = unsafe.array_includes(cs, 'k.fo');
        this.is_free_village = unsafe.array_includes(cs, 'k.vt');
        if (this.is_free_village) {
          let regExp = /k\.f[1-9][1-9]?/;
          let farm_class = single(cs.filter(x=>regExp.test(x)));
          this.farms = (<string>unsafe.get(translate, farm_class)).split('-').map(x=>+x);
        }
      }
    }
  }
  /**
   * @param cx : number -400..400
   * @param cy : number -400..400
   * @param zoom_level : number 1..3
   * */
  export function get_map_data(cx: number, cy: number, zoom_level: number, cb: (tiles: Tile[])=>void) {
    let formData = new FormData();
    /*
     cmd:mapPositionData
     data[x]:-57
     data[y]:23
     data[zoomLevel]:1
     (empty)
     ajaxToken:049d984c893da7b0c715bbe800f496b5
     */
    formData.append("cmd", "mapPositionData");
    formData.append("data[x]", cx);
    formData.append("data[y]", cy);
    formData.append("data[zoomLevel]", zoom_level);
    formData.append("", "");
    formData.append("ajaxToken", unsafe.get(window, window_keys.ajaxToken));

    let request = new XMLHttpRequest();
    request.addEventListener("load", function () {
      let res = JSON.parse(this.responseText).response;
      if (res.error) {
        throw new Error(res);
      } else {
        cb(res.data.tiles.map((x: any)=>new Tile(x)));
      }
    });
    request.open("POST", "ajax.php?cmd=mapPositionData");
    request.send(formData);
  }
}
