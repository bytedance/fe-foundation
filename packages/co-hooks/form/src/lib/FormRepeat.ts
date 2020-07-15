/**
 * @file Repeat 重复
 */

import {NestWatcher} from '@co-hooks/nest-watcher';
import {deepClone, getUniqueKey} from '@co-hooks/util';
import {getNestWatchPath} from '../util';
import {FormDomNode} from '../types';
import {FormGroup, IFormGroupInfo, IFormGroupOptions} from './FormGroup';
import {Form} from './Form';

export interface IFormRepeatOptions<T> extends Omit<IFormGroupOptions, 'defaultValue'> {
    defaultValue?: T[];
    itemInitValue: T | (() => T);
    field: string;
}

export interface IFormRepeatInfo<T> extends IFormGroupInfo {
    datasource: T[];
    keys: string[];
}

export class FormRepeat<T> extends FormGroup {

    protected itemInitValue: T | (() => T);

    protected parts: Record<string, FormDomNode> = {};

    protected partGroups: Record<string, FormGroup> = {};

    protected partKeys: string[] = [];

    constructor(form: Form, scope: FormDomNode, options: IFormRepeatOptions<T>) {

        super(form, scope, {
            field: options.field,
            defaultValue: options.defaultValue || []
        });

        this.itemInitValue = options.itemInitValue;
        this.initRepeat();
    }

    public isRepeat(): this is FormRepeat<T> {
        return true;
    }

    public getRepeatGroup(key: string): FormGroup {
        return this.partGroups[key];
    }

    public appendRepeatItem(data?: T): void {
        const path = this.getPath();
        const value: T[] = this.form.getPathValue(path);
        this.form.setPathValue(path, value.concat(data == null ? this.getItemInitValue() : data));
    }

    public insertBeforeRepeatItem(key: string, data?: T): void {

        const path = this.getPath();
        const value: T[] = this.form.getPathValue(path);
        const index = Math.max(this.node.getIndex(this.parts[key]) - 1, 0);

        const list = value.slice(0);
        list.splice(index, 0, data == null ? this.getItemInitValue() : data);

        this.form.setPathValue(path, list);
    }

    public insertAfterRepeatItem(key: string, data?: T): void {

        const path = this.getPath();
        const value: T[] = this.form.getPathValue(path);
        const index = Math.max(this.node.getIndex(this.parts[key]) + 1, value.length);

        const list = value.slice(0);
        list.splice(index, 0, data == null ? this.getItemInitValue() : data);

        this.form.setPathValue(path, list);
    }

    public insertRepeatItem(key: string, data?: T): void {

        const path = this.getPath();
        const value: T[] = this.form.getPathValue(path);
        const list = value.slice(0);
        const index = this.node.getIndex(this.parts[key]);

        list.splice(index, 0, data == null ? this.getItemInitValue() : data);

        this.form.setPathValue(path, list);
    }

    public removeRepeatItem(key: string): void {
        const path = this.getPath();
        const value: T[] = this.form.getPathValue(path);
        const list = value.slice(0);
        const index = this.node.getIndex(this.parts[key]);

        list.splice(index, 1);

        this.form.setPathValue(path, list);
    }

    public sortRepeatItem(fromKey: string, toKey: string): void {

        const path = this.getPath();
        const value: T[] = this.form.getPathValue(path);
        const list = value.slice(0);
        const from = this.node.getIndex(this.parts[fromKey]);
        let to = this.node.getIndex(this.parts[toKey]);

        if (from === to) {
            return;
        }

        if (from < to) {
            to--;
        }

        list.splice(to, 0, ...list.splice(from, 1));
        this.form.setPathValue(path, list);
    }

    public getRepeatInfo(): IFormRepeatInfo<T> {

        const group = this.getGroupInfo();

        return {
            ...group,
            keys: this.partKeys,
            datasource: this.form.getPathValue(this.getPath())
        };
    }

    private initRepeat(): void {

        // 监控其他字段的刷新
        this.form.absoluteWatch(this.id, [NestWatcher.combineKeys(getNestWatchPath(this.node))], () => {
            this.updateBrickParts();
        });

        this.updateBrickParts(true);
    }

    private updateBrickParts(isSilent: boolean = false): void {

        const newPartList = this.getPartList();
        const container = this.node;
        const oldList = container.getChildNodes();
        const len = oldList.length;
        const usedKeys: Record<string, boolean> = {};

        newPartList.forEach((part, i) => {

            const elem = this.parts[part] || this.createPartNode(part);

            usedKeys[part] = true;

            if (i >= len) {
                container.appendChild(elem);
            } else if (elem !== oldList[i]) {
                container.insertBefore(elem, oldList[i]);
            }
        });

        Object.keys(this.parts).forEach(key => {
            if (!usedKeys[key]) {
                this.parts[key].remove();
                this.partGroups[key].dispose();
            }
        });

        if (!isSilent) {
            this.emit('repaint');
        }
    }

    private getPartList(): string[] {

        const value: T[] = this.form.getPathValue(this.getPath());

        if (!Array.isArray(value)) {
            return [];
        }

        return this.partKeys = value.map(item => getUniqueKey(item));
    }

    private createPartNode(part: string): FormDomNode {

        const group = this.partGroups[part] = new FormGroup(this.form, this.node, {
            field: part,
            defaultValue: this.itemInitValue,
            repeat: true
        });

        return this.parts[part] = group.getNode();
    }

    private getItemInitValue(): T {

        const fn = this.itemInitValue;

        return typeof fn === 'function' ? (fn as () => T)() : deepClone(fn);
    }
}
