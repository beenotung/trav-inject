// import * as $ from 'jquery';

const app_name = 'travian-auto';

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

function init() {
    console.log('begin init');
    if(!isDefined(window[<number><any>'runTime'])){
        window[<number><any>'runTime']=<Window>{}
    }
    if (runTime[app_name] && false) {
        console.warn(app_name + ' already running, reload the page to stop the previous instance');
        return;
    }
    runTime[app_name] = true;
    set(app_name, AppStatus.init);
    setTimeout(loop);
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

enum StorageKey{
    taskid_stack,
    resource,
    lastUid,
    task_map
}
class Task {
    pathname: string;
    id: number;
    type: TaskType;

    nextTask: Optional<Task>;

    run(callback: Function) {
        let res = someFromArray(Tasks.list
            .filter(x=>x.type == this.type));
        res.useOrElse(
            t=>t.run(callback)
            , ()=> {
                console.error('not impl', this);
                throw new Error('Task type not registered')
            }
        );
    }

    runAll(callback: Function) {
        console.log('run task', this);
        this.run(()=> {
            this.nextTask.forEach(x=>x.runAll(callback));
        });
    }

    constructor(data?: any) {
        Object.assign(this, data);
        if (!isDefined(this.id)) {
            this.id = newId();
        }
        if (this.nextTask) {
            Object.setPrototypeOf(this.nextTask, Optional.prototype);
        } else {
            this.nextTask = new Optional<Task>();
        }
    }

    store() {
        set(this.id, this);
    }

    remove() {
        localStorage.removeItem(this.id + "");
    }

    static load(id: number): Task {
        return new Task(get(id, ()=> {
            throw new Error("Task-" + id + " not found!")
        }));
    }
}
module Tasks {
    export const list: Task[] = [];

    export const findTask = new Task();
    list.push(findTask);
    findTask.type = TaskType.find_task;
    findTask.run = (cb)=> {
        console.log('find task');
        // check_building_list.runAll(cb);
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
        if (location.pathname != '/dorf1.php' && location.pathname != '/dorf2.php') {
            location.replace('/dorf1.php');
            cb();
        }
        let res = $('.buildingList')
                .find('.buildDuration')
                .val()
            ;
        console.log(res);
    };
}


/* -------------- begin task id stack ------------ */
function getStack() {
    return get(StorageKey.taskid_stack, ()=>[]);
}
function storeStack(xs: number[]) {
    set(StorageKey.taskid_stack, xs);
}
function pushStack(id: number) {
    let xs = getStack();
    xs.push(id);
    storeStack(xs);
}
function popStack() {
    let xs = getStack();
    let res = xs.pop();
    storeStack(xs);
    return res;
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
        task.runAll(()=> {
            popStack();
            setTimeout(next);
        });
    }

    setTimeout(next)
}

init();
