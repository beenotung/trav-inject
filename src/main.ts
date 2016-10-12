import * as $ from 'jquery';

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
}
function some<A>(x: A): Optional<A> {
    return new Optional<A>(x);
}
function none<A>(): Optional<A> {
    return new Optional<A>(void 0);
}
function wrap<A>(x: A) {
    return ()=>x;
}
function newId(): number {
    let lastUid = get(Storage.lastUid, wrap(0));
    let res = lastUid + 1;
    set(Storage.lastUid, res);
    return res;
}
/* -------------------- end utils ----------------------*/

enum AppStatus{
    init, upgrade, ready
}

function init() {
    console.log('begin init');
    if (has(app_name)) {
        set(app_name, AppStatus.upgrade);
    } else {
        set(app_name, AppStatus.init);
    }
    setTimeout(loop);
    console.log('end init')
}

enum TaskType{
    find_task,
    check_building_list,
    check_resource,
    find_upgrade_farm,
    upgrade_farm,
}

enum Storage{
    taskid_stack,
    resource,
    lastUid,
    task_map
}

class Task {
    id: number;
    type: TaskType;

    nextTask: Optional<Task>;

    run(callback: Function) {
        switch (this.type) {
            case TaskType.find_task: {
                let next = new Task();
                this.nextTask = new Optional<Task>(next);
                next.type = TaskType.check_building_list;
                break;
            }
            case TaskType.check_building_list: {
                console.log('check building_list');
                break;
            }
            case TaskType.check_resource: {
                console.log('check resource');
                break;
            }
            default: {
                console.error('not impl', this);
            }
        }
        callback();
    }

    runAll(callback: Function) {
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

    remote() {
        localStorage.removeItem(this.id);
    }

    static load(id: number): Task {
        return get(id, ()=> {
            throw new Error("Task-" + id + " not found!")
        })
    }
}

/* -------------- begin task id stack ------------ */
function getStack() {
    return get(Storage.taskid_stack, ()=>[]);
}
function storeStack(xs: number[]) {
    set(Storage.taskid_stack, xs);
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
    let find_task = new Task();
    find_task.id = newId();
    find_task.type = TaskType.find_task;
    find_task.store();
    // let stack: number[] = getOrSetDefault(Storage.taskid_stack, ()=>[find_task.id]);

    function next() {
        let task_id = last(getStack());
        if (!isDefined(task_id)) {
            console.log('no task');
            pushStack(find_task.id);
        }
        let task = Task.load(task_id);
        task.runAll(()=> {
            stack.pop();
            set(Storage.taskid_stack, stack);
            setTimeout(next);
        });
    }

    setTimeout(next)
}

init();