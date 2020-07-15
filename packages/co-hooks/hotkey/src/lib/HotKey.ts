/**
 * @file HotKey
 */
import {MAP, SHIFT_MAP, SPECIAL_ALIASES} from './AllKeysMap';

export type CallbackFun = (e: KeyboardEvent, hotKey: string) => void | false;

export type HotKeyEventType = 'keydown' | 'keypress' | 'keyup';

export type HotKeyEvent = KeyboardEvent & {
    __which__: number;
};

export interface IHotKeyInfo {
    key: string;
    keys: string[];
    hotKey: string;
    modifiers: string[];
    eventType: HotKeyEventType;
    callback: CallbackFun;
}

export class HotKey {

    private ele: HTMLDocument | HTMLElement = document;

    private readonly callbacks: {[key: string]: IHotKeyInfo[]} = {};

    constructor() {
        this.bindEvent(this.ele);
    }

    public dispose(): void {
        this.unbindEvent(this.ele);
    }

    public init(ele: HTMLElement | HTMLDocument): void {
        if (this.ele !== ele) {
            const old = this.ele;
            old && this.unbindEvent(old);
            this.bindEvent(ele);
            this.ele = ele;
        }
    }

    public addHotKeys(
        hotKeys: string[],
        callback: CallbackFun,
        eventType: HotKeyEventType,
        first: boolean = false
    ): void {
        hotKeys.forEach(hotKey => {
            const info = this.getHotKeyInfo(hotKey, eventType, callback);

            this.callbacks[info.key] = this.callbacks[info.key] || [];

            if (first) {
                this.callbacks[info.key].unshift(info);
            } else {
                this.callbacks[info.key].push(info);
            }
        });
    }

    public removeHotKeys(hotKeys: string[], callback: CallbackFun, eventType: HotKeyEventType): void {
        hotKeys.forEach(hotKey => {
            const info = this.getHotKeyInfo(hotKey, eventType, callback);

            const currentCbs = this.callbacks[info.key] || [];

            if (!currentCbs.length) {
                return;
            }

            let idx: number | null = null;
            currentCbs.some((item, i) => {
                const {modifiers, callback: cb} = item;

                if (this.modifiersEqual(modifiers, info.modifiers) && callback === cb) {
                    idx = i;
                    return true;
                }
            });

            if (idx != null) {
                currentCbs.splice(idx, 1);
            }
        });
    }

    public handleEvent(e: KeyboardEvent): void {
        (e as HotKeyEvent).__which__ = e.which || e.keyCode || e.charCode;

        const char = this.getCharFromEvent(e as HotKeyEvent);

        if (!char) {
            return;
        }

        this.emitCallback(char, e as HotKeyEvent);
    }

    private bindEvent(ele: HTMLElement | HTMLDocument): void {
        ele.addEventListener('keydown', this, false);
        ele.addEventListener('keypress', this, false);
        ele.addEventListener('keyup', this, false);
    }

    private unbindEvent(ele: HTMLElement | HTMLDocument): void {
        ele.removeEventListener('keydown', this, false);
        ele.removeEventListener('keypress', this, false);
        ele.removeEventListener('keyup', this, false);
    }

    private emitCallback(char: string, e: HotKeyEvent): void {
        const modifiers = this.getEventModifiers(e);
        const cbs = this.getMatchesCallback(char, modifiers, e);
        const element = e.target || e.srcElement;

        if (this.stopCallback(e, element as HTMLElement)) {
            return;
        }

        cbs.forEach(cb => {
            const {callback, hotKey} = cb;

            if (callback(e, hotKey) === false) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    private getMatchesCallback(char: string, modifiers: string[], e: HotKeyEvent): IHotKeyInfo[] {
        const matches: IHotKeyInfo[] = [];
        const callbacks = this.callbacks[char] || [];

        if (!callbacks.length) {
            return matches;
        }

        callbacks.forEach(info => {
            const {eventType, modifiers: infoModifiers} = info;

            if (
                eventType !== e.type
                || !this.modifiersEqual(infoModifiers, modifiers)
            ) {
                return;
            }

            matches.push(info);
        });

        return matches;
    }

    private getCharFromEvent(e: HotKeyEvent): string {
        const code = e.__which__;

        if (e.type === 'keypress') {
            const char = String.fromCharCode(code);

            if (!e.shiftKey) {
                return char.toLowerCase();
            }

            return char;
        }

        if (MAP[code] || SHIFT_MAP[code]) {
            return MAP[code] || SHIFT_MAP[code];
        }

        return String.fromCharCode(code).toLowerCase();
    }

    private getEventModifiers(e: HotKeyEvent): string[] {
        const modifiers: string[] = [];

        if (e.altKey) {
            modifiers.push('alt');
        }

        if (e.ctrlKey) {
            modifiers.push('ctrl');
        }

        if (e.metaKey) {
            modifiers.push('meta');
        }

        if (e.shiftKey) {
            modifiers.push('shift');
        }

        return modifiers;
    }

    private modifiersEqual(modifersA: string[], modifiersB: string[]): boolean {
        return modifersA.sort().join(',') === modifiersB.sort().join(',');
    }

    private isModifier(char: string): boolean {
        return char === 'shift'
            || char === 'alt'
            || char === 'meta'
            || char === 'ctrl';
    }

    private getHotKeyInfo(hotKey: string, eventType: HotKeyEventType, callback: CallbackFun): IHotKeyInfo {
        const keys = hotKey
            .replace(/\+{2}/, '+plus')
            .split('+');
        const modifiers: string[] = [];
        let key = '';

        keys.forEach(item => {
            key = item;

            if (SPECIAL_ALIASES[key]) {
                key = SPECIAL_ALIASES[key];
            }

            if (eventType !== 'keypress' && SHIFT_MAP[key]) {
                key = SHIFT_MAP[key];
                modifiers.push('shift');
            }

            if (this.isModifier(key)) {
                modifiers.push(key);
            }
        });

        return {
            key,
            keys,
            hotKey,
            modifiers,
            eventType: this.getBestEventType(modifiers, eventType),
            callback
        };
    }

    private getBestEventType(modifiers: string[], type: HotKeyEventType): HotKeyEventType {
        if (type === 'keypress' && modifiers.length) {
            return 'keydown';
        }

        return type;
    }

    // 判断是否阻止之心callback
    private stopCallback(e: HotKeyEvent, element: HTMLElement): boolean {
        if (!this.ele) {
            return true;
        }

        if (this.contains(element, this.ele)) {
            return false;
        }

        const tagName = element.tagName.toUpperCase();

        return tagName === 'INPUT'
            || tagName === 'SELECT'
            || tagName === 'TEXTAREA'
            || element.isContentEditable;
    }

    private contains(ele: HTMLElement | HTMLDocument | null, ancestor: HTMLElement | HTMLDocument): boolean {
        if (ele == null || ele === document) {
            return false;
        }

        if (ele === ancestor) {
            return true;
        }

        return this.contains(ele.parentNode as HTMLElement, ancestor);
    }
}
