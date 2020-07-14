/**
 * @file PriorityQueue 优先队列
 */

export interface IPriorityQueue {

    // 任务的名字
    key: string;

    // 任务的执行函数
    fn: <T>(queue: PriorityQueue, payload: T) => Promise<void>;
}

export interface IPriorityQueueTaskInfo extends IPriorityQueue {
    callbacks: Array<(success: boolean, msg: string) => void>;
    payload: unknown;
    runLevel: number;
}

// 一个内置的幂等队列
export class PriorityQueue {

    private readonly priorities: IPriorityQueue[];
    private readonly taskMap: {[key: string]: IPriorityQueueTaskInfo} = {};
    private running: boolean = false;

    constructor(priorities: IPriorityQueue[]) {
        this.priorities = priorities;
        this.initTasks(priorities);
    }

    public execute(key: string, payload: unknown): Promise<void> {

        const taskInfo = this.taskMap[key];

        if (!taskInfo) {
            return Promise.reject('invalid task name =' + key);
        }

        taskInfo.payload = payload;

        const promise = new Promise<void>((resolve, reject) => {
            taskInfo.callbacks.push((success, msg) => (success ? resolve() : reject(msg)));
            taskInfo.runLevel++;
        });

        if (!this.running) {
            this.runTask(key);
        }

        return promise;
    }

    public executeAsync(key: string, payload: unknown): void {

        const taskInfo = this.taskMap[key];

        if (!taskInfo) {
            throw new Error('invalid task name =' + key);
        }

        taskInfo.payload = payload;

        taskInfo.runLevel++;

        if (!this.running) {
            this.runTask(key);
        }
    }

    private initTasks(priorities: IPriorityQueue[]): void {

        priorities.forEach(item => {

            this.taskMap[item.key] = {
                ...item,
                payload: null,
                callbacks: [],
                runLevel: 0
            };
        });
    }

    private runTask(key: string): void {

        const taskInfo = this.taskMap[key];
        const callbacks = taskInfo.callbacks;
        const level = taskInfo.runLevel;

        // 重置
        taskInfo.callbacks = [];

        this.running = true;

        taskInfo
            .fn(this, taskInfo.payload)
            .then(
                () => {
                    if (level === taskInfo.runLevel) {
                        callbacks.forEach(item => item(true, ''));
                    }
                },
                (msg: string) => {
                    if (level === taskInfo.runLevel) {
                        callbacks.forEach(item => item(false, msg));
                    }
                }
            )
            .then(() => {
                this.running = false;
                this.detectNextTask();
            })
            .catch(e => {
                console.log(e);
            });
    }

    private detectNextTask(): void {

        for (const priority of this.priorities) {

            const taskInfo = this.taskMap[priority.key];

            if (taskInfo.callbacks.length) {
                this.runTask(priority.key);
                break;
            }
        }
    }
}
