/**
 * @file Mask 遮罩层操作类
 */

import {Emitter} from '@co-hooks/emitter';
import {IDragEvent} from '@co-hooks/drag';
import {HotKey} from './HotKey';

export interface IMaskEvent {
    'change': [string];
}

export type IMaskMouseEvent = (e: IDragEventGlobal) => void;

export type IDragEventGlobal = IDragEvent<any>;

export interface IMaskOpItem {
    key: string;
    onDragStart?: IMaskMouseEvent;
    onDragging?: IMaskMouseEvent;
    onDragEnd?: IMaskMouseEvent;
    onClick?: IMaskMouseEvent;
    handler: (state: boolean) => void;
}

export class Mask extends Emitter<IMaskEvent> {

    private readonly hotkey: HotKey;

    // 当前激活的Mask操作
    private activeKey: string = '';

    // 所有操作集合
    private readonly op: { [key: string]: IMaskOpItem } = {};

    /**
     * 构造函数
     *
     * @param {HotKey}  hotkey
     */
    constructor(hotkey: HotKey) {

        super();

        this.hotkey = hotkey;
    }

    /**
     * 注册拖拽事件
     */
    public register(key: string, options: Partial<IMaskOpItem>): void {
        const {onDragStart, onDragging, onDragEnd, onClick} = options;

        // 不能重复定义功能按键
        if (key in this.op) {
            throw new Error(`register duplicate op '${key}'`);
        }

        this.op[key] = {
            key,
            onDragStart,
            onDragging,
            onDragEnd,
            onClick,
            handler: state => {
                this.activeKey = state ? key : '';
                this.emit('change', this.activeKey);
            }
        };

        this.hotkey.registerFuncKey(key);
        this.hotkey.addListener(key + '-change', this.op[key].handler);
    }

    /**
     * 注销拖拽事件
     */
    public unregister(key: string): void {

        // 不能重复定义功能按键
        if (!(key in this.op)) {
            return;
        }

        let handler = this.op[key].handler;

        this.hotkey.unregisterFuncKey(key);
        this.hotkey.removeListener(key + '-change', handler);

        delete this.op[key];
    }

    /**
     * 拖拽开始事件
     *
     * @param {Event} e 事件对象
     */
    public onDragStart(e: IDragEventGlobal): void {

        if (!this.activeKey) {
            return;
        }

        const {onDragStart} = this.op[this.activeKey];

        onDragStart && onDragStart(e);
    }

    /**
     * 拖拽中事件
     *
     * @param {Event} e 事件对象
     */
    public onDragging(e: IDragEventGlobal): void {
        if (!this.activeKey) {
            return;
        }

        const {onDragging} = this.op[this.activeKey];

        onDragging && onDragging(e);
    }

    /**
     * 拖拽结束
     *
     * @param {Event} e 事件对象
     */
    public onDragEnd(e: IDragEventGlobal): void {
        if (!this.activeKey) {
            return;
        }

        const {onDragEnd} = this.op[this.activeKey];

        onDragEnd && onDragEnd(e);
    }

    /**
     * 点击事件
     *
     * @param {Event} e 事件对象
     */
    public onClick(e: IDragEventGlobal): void {
        if (!this.activeKey) {
            return;
        }

        const {onClick} = this.op[this.activeKey];

        onClick && onClick(e);
    }
}
