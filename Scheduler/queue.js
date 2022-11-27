class TaskQueue {
    constructor() {
      this._heap = [];
      this._comparator = (task1,task2) => task1.priority < task2.priority;
      this.top = 0;
      this.m = new Map()
      this.graph = new Map();
    }
    size() {
      return this._heap.length;
    }
    peek() {
      return this._heap[this.top];
    }
    checkDep(node,cycle = {}){
       // console.log(node)
        if(node in cycle){
            return -1;
        }
        cycle[node] = true;
        for(let dep of this.graph.get(node)){
            if(this.m.has(dep)){
                return this.checkDep(dep,cycle);
            }
        }
        cycle[node] = false;
        return node;
    }
    push(task) {
        if(this.m.has(task.name))
            return;
        this._heap.push(task);
        this.m.set(task.name,this.size())
        this.graph.set(task.name,task.dependencies)
        let index = this.size()-1;
        while(index != 0 && 
            this._comparator(this._heap[Math.floor((index -1)/2)],this._heap[index])){
                this._swap(Math.floor((index -1)/2),index)
                this.m.set(this._heap[index].name,index + 1) 
                this.m.set(this._heap[Math.floor((index -1)/2)].name,(Math.floor((index -1)/2)) +1);
                index = Math.floor((index-1)/2);
            }
      return this.size();
    }
    pop() {
      const poppedValue = this.peek();
      const bottom = this.size() - 1;
      if (bottom > this.top) {
        this._swap(this.top, bottom);
        this.m.set(this._heap[this.top].name,this.top +1) 
                this.m.set(this._heap[bottom].name,bottom+1);
      }
      this._heap.pop();
      this.heapify(this.top);
      this.m.delete(poppedValue.name)
      return poppedValue;
    }
    nextTask(){
        let poppedTask = this.peek();
        let dep = this.checkDep(poppedTask.name);
        if(dep == -1)
            return this.pop();
        if(dep != poppedTask.name){
            return this._popWithId(dep)
        }
        return this.pop();
    }
    _swap(i, j) {
        [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
      }
    heapify(index)
    {
        let leftChild = 2 * index + 1,
         rightChild = 2 * index + 2,
         suitableNode = index;

        if (leftChild < this.size()
        && this._comparator(this._heap[suitableNode],
                this._heap[leftChild])) {
        suitableNode = leftChild;
        }

        if (rightChild < this.size()
        && this._comparator(this._heap[suitableNode],
                this._heap[rightChild])) {
        suitableNode = rightChild;
        }

        if (suitableNode != index) {

        let temp = this._heap[index];
        this._heap[index] = this._heap[suitableNode];
        this._heap[suitableNode] = temp;

        this.m.set(this._heap[index].name,index + 1) 
        this.m.set(this._heap[suitableNode].name,suitableNode + 1);

        this.heapify(suitableNode);
        }
    }
    _popWithId(id){
        let index = this.m.get(id)-1;
        const poppedValue =  Object.assign(Object.create(Object.getPrototypeOf(this._heap[index])), this._heap[index]);
        this._heap[index].priority = Number.MAX_SAFE_INTEGER;
        while(index != 0 && 
            this._comparator(this._heap[Math.floor((index -1)/2)],this._heap[index])){
                this._swap(Math.floor((index -1)/2),index)
                this.m.set(this._heap[index].name,index + 1) 
                this.m.set(this._heap[Math.floor((index -1)/2)].name,Math.floor((index -1)/2) +1);
                index = Math.floor((index-1)/2);
            }
        this.pop();
        return poppedValue;
    }
}

class Task {
    constructor(priority,id,dep) {
        this.priority = priority;
        this.name = id;
        this.dependencies = dep;
    }
}

const tasks = []

for(let i =0; i<100;i++){
    const id = Math.floor(Math.random() * 100)
    const priority = Math.floor(Math.random() * 1000)
    const dep = [];
    for(let z = 0 ;z<3;z++){
       if(tasks.length > 3)
        dep.push(tasks[Math.floor(Math.random()*tasks.length)].name)
    }
    tasks.push(new Task(priority,id,dep))
}
let q = new TaskQueue()
let j = 0;
let fail = 0,pass = 0;
function copy(q){
    let clone = new TaskQueue();
    clone._heap = JSON.parse(JSON.stringify(q._heap));
    clone.m = new Map(q.m);
    clone.graph = new Map(q.graph);
    return clone;
}
function check(q){
    let clone = copy(q);
    let prev = clone.size()?clone.pop().priority:0;
    while(clone.size()){
        if(prev < clone.peek().priority){
            fail++;
            return;
        }
        prev = clone.pop().priority
    }
    pass++;
}
while(j<100){
    const op = Math.floor(Math.random()*2);
    //console.log(op)
    if(op ==0){
        if(q.size())
            q.nextTask()
    }
    else if(op == 1)
        q.push(tasks[j++]);
    check(q);
}
console.log("fail", fail, "pass", pass)

module.exports = {
    TaskQueue,
    copy
}