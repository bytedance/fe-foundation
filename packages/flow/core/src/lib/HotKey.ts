/**
 * @file HotKey 快捷键工具
 */

import {Emitter} from '@co-hooks/emitter';
import {CallbackFun, HotKey as CommonHotKey} from '@co-hooks/hotkey';

/**
 * 用于判断是不是Mac
 *
 * @type {boolean}
 */
const IS_MAC = ['Mac68K', 'MacPPC', 'Macintosh', 'MacIntel'].indexOf(navigator.platform) >= 0;

/**
 * 不同平台的按键统一
 *
 * @type {Object}
 */
const HOT_KEY_ALIAS = {
    command: IS_MAC ? 'command' : 'ctrl',
    alt: IS_MAC ? 'option' : 'alt',
    delete: 'backspace'
};

export type HotKeyAlias = keyof typeof HOT_KEY_ALIAS;

export type FuncKey = 'command' | 'ctrl' | 'option' | 'alt' | 'backspace';

export type KeyFunction = CallbackFun;

export interface IFuncKeyStateItem {
    state: boolean;
    keydown: KeyFunction;
    keyup: KeyFunction;
}

export interface IHotKeyOptions {
    keydown?: KeyFunction;
    keyup?: KeyFunction;
    keypress?: KeyFunction;
    latest?: boolean;
}

export class HotKey extends Emitter<Record<string, [boolean]>> {

    public static IS_MAC: boolean = IS_MAC;

    public static HOT_KEY_ALIAS: typeof HOT_KEY_ALIAS = HOT_KEY_ALIAS;

    // 事件监听器
    private readonly listener: CommonHotKey = new CommonHotKey();

    // 按键按下事件
    private funcKeyState: Record<string, IFuncKeyStateItem> = {};

    /**
     * 注册快捷键
     */
    public registerHotKey(key: string, options: IHotKeyOptions): void {
        const {keydown, keyup, keypress, latest} = options;
        this.register(key, keydown, keyup, keypress, latest);
    }

    /**
     * 删除快捷键
     */
    public unregisterHotKey(key: string, options: IHotKeyOptions): void {
        const {keydown, keyup, keypress} = options;
        this.unregister(key, keydown, keyup, keypress);
    }

    /**
     * 注册一个功能按键
     *
     * @param {string} key 按键名字
     */
    public registerFuncKey(key: string): void {

        const bindKey = HOT_KEY_ALIAS[key as HotKeyAlias] || key;

        if (this.funcKeyState[bindKey]) {
            return;
        }

        const funcKeyItem: IFuncKeyStateItem = {
            keydown: () => {
                if (this.funcKeyState[bindKey]) {
                    this.emit(`${key}-change`, this.funcKeyState[bindKey].state = true);
                }
            },
            keyup: () => {
                if (this.funcKeyState[bindKey]) {
                    this.emit(`${key}-change`, this.funcKeyState[bindKey].state = false);
                }
            },
            state: false
        };

        this.funcKeyState[bindKey] = funcKeyItem;

        this.register(
            bindKey,
            funcKeyItem.keydown,
            funcKeyItem.keyup
        );
    }

    /**
     * 注册一个功能按键
     *
     * @param {string} key 按键名字
     */
    public unregisterFuncKey(key: string): void {

        key = HOT_KEY_ALIAS[key as HotKeyAlias] || key;
        const funcKeyStateInfo = this.funcKeyState[key];

        if (!funcKeyStateInfo) {
            return;
        }

        let {keydown, keyup} = funcKeyStateInfo;
        delete this.funcKeyState[key];

        this.unregister(key, keydown, keyup);
    }

    /**
     * 功能键是否按下
     *
     * @param {string} key 按键名字
     * @return {boolean}
     */
    public isFuncKeyDown(key: string): boolean {

        key = HOT_KEY_ALIAS[key as HotKeyAlias] || key;
        const funcKeyStateInfo = this.funcKeyState[key as FuncKey];

        if (!funcKeyStateInfo) {
            return false;
        }

        return funcKeyStateInfo.state;
    }

    /**
     * 注册快捷键
     *
     * @private
     * @param {string} key 快捷键
     * @param {Function=} keydown 按下事件
     * @param {Function=} keyup 抬起事件
     * @param {Function=} keypress 按键事件
     * @param {boolean=} latest 是否插入到最后（比较适合于绑定在window上的事件）
     * @return {HotKey}
     */
    private register(
        key: string,
        keydown?: KeyFunction,
        keyup?: KeyFunction,
        keypress?: KeyFunction,
        latest: boolean = false
    ): void {

        if (keydown != null) {
            this.listener.addHotKeys([key], keydown, 'keydown', !latest);
        }

        if (keyup != null) {
            this.listener.addHotKeys([key], keyup, 'keyup', !latest);
        }

        if (keypress != null) {
            this.listener.addHotKeys([key], keypress, 'keypress', !latest);
        }
    }

    /**
     * 删除快捷键
     *
     * @private
     * @param {string} key 快捷键
     * @param {Function=} keydown 按下事件
     * @param {Function=} keyup 抬起事件
     * @param {Function=} keypress 按键事件
     * @return {HotKey}
     */
    private unregister(
        key: string,
        keydown?: KeyFunction,
        keyup?: KeyFunction,
        keypress?: KeyFunction
    ): void {

        if (keydown != null) {
            this.listener.removeHotKeys([key], keydown, 'keydown');
        }

        if (keyup != null) {
            this.listener.removeHotKeys([key], keyup, 'keyup');
        }

        if (keypress != null) {
            this.listener.removeHotKeys([key], keypress, 'keypress');
        }
    }
}
