/**
 * @file BasePlugin
 */
import {HotKeyEventType} from '@co-hooks/hotkey';
import {guid} from '@co-hooks/util';
import {Canvas, ICanvasConfig} from './Canvas';
import {Mask} from './Mask';
import {HotKey} from './HotKey';

export interface IHotKeyItem<T> {
    key: string;
    eventType?: HotKeyEventType;
    handler: (editor: T, e: KeyboardEvent, hotKey: string) => void;
}

export interface IBasePluginConfig<T> {
    canvas?: ICanvasConfig & {
        zoom?: number;
    };

    hotKey?: Array<IHotKeyItem<T>>;
}

export class BasePlugin<T> {
    // 快捷键管理
    protected readonly hotKey: HotKey = new HotKey();

    // 画布管理
    protected readonly canvas: Canvas;

    // 浮出层管理
    protected readonly mask: Mask;

    private readonly root: T;

    private hotkeyMap: Record<string, any> = {};

    constructor(root: T, config: IBasePluginConfig<T>) {

        const {canvas = {}, hotKey = []} = config;

        const {zoom = 100, ...extra} = canvas;

        this.root = root;
        this.canvas = new Canvas(zoom, extra);
        this.hotKey = new HotKey();
        this.mask = new Mask(this.hotKey);

        this.initHotKey(hotKey);
    }

    public getCanvas(): Canvas {
        return this.canvas;
    }

    public getMask(): Mask {
        return this.mask;
    }

    public getHotKey(): HotKey {
        return this.hotKey;
    }

    public initHotKey(hotKeyList: Array<IHotKeyItem<T>>): void {
        hotKeyList.forEach(item => {
            const {key, eventType, handler} = item;
            const id = guid();

            this.hotkeyMap[id] = {
                key,
                eventType: eventType || 'keydown',
                handler: (e: KeyboardEvent, hotKey: string) => handler(this.root, e, hotKey)
            };

            this.hotKey.registerHotKey(key, {
                [this.hotkeyMap[id].eventType]: this.hotkeyMap[id].handler
            });
        });
    }

    public disposeHotKey(): void {
        Object.values(this.hotkeyMap).forEach(item => {
            this.hotKey.unregisterHotKey(item.key, {
                [item.eventType]: item.handler
            });
        });
    }
}
