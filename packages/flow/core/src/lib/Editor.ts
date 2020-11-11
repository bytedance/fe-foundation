/**
 * @file Editor 编辑器核心代码
 */

import {Emitter} from '@co-hooks/emitter';
import {NodeType} from '@chief-editor/base';
import {IEditorBrickConfigGlobal, IEditorBrickConfigs} from '../types';
import {HotKey} from './HotKey';
import {Mask} from './Mask';
import {Canvas} from './Canvas';
import {EditorBrickGlobal} from './EditorBrick';
import {EditorBoard} from './EditorBoard';
import {EditorTemplate, IEditorTemplateConfig} from './EditorTemplate';
import {History} from './History';
import {BasePlugin, IBasePluginConfig, IHotKeyItem} from './BasePlugin';

export interface IEditorEvent {
    'editor-change': [];
    'active-template-change': [string];
    'active-board-change': [string];
    'active-brick-change': [string[]];
}

export interface IEditorConfig<T extends EditorTemplate> extends IBasePluginConfig<Editor<T>> {

    // 组件配置信息
    brickConfigs: Record<string, IEditorBrickConfigGlobal>;

    // 用来控制触发拖拽的鼠标偏移量
    dragLimit?: number;
}

function getFunctionalTemplateConfig(name: string): IEditorTemplateConfig {
    return {
        id: name,
        isFunctionalTemplate: true,
        width: 1300,
        height: 900,
        board: {
            bricks: [],
            type: NodeType.STREAM
        }
    };
}

export class Editor<T extends EditorTemplate = EditorTemplate> extends Emitter<IEditorEvent> {

    protected readonly plugin: BasePlugin<Editor<T>>;

    protected readonly history: History;

    // 组件配置信息
    private readonly brickConfigs: IEditorBrickConfigs;

    // 拖拽需要的最低偏移量
    private readonly dragLimit: number;

    // 模板映射字典
    private templateMap: Record<string, T> = {};

    private readonly draftTemplate: EditorTemplate;

    private readonly stashTemplate: EditorTemplate;

    // 当前激活的模板
    private activeTemplateId: string = '';

    constructor(config: IEditorConfig<T>) {

        super();

        const {dragLimit = 10, brickConfigs, canvas, hotKey} = config;

        this.dragLimit = dragLimit;
        this.brickConfigs = brickConfigs;

        this.draftTemplate = new EditorTemplate(this, getFunctionalTemplateConfig('draft'));
        this.stashTemplate = new EditorTemplate(this, getFunctionalTemplateConfig('stash'));

        this.history = new History(this);
        this.plugin = new BasePlugin(this, {canvas, hotKey});
    }

    public disposeHotKey(): void {
        this.plugin.disposeHotKey();
    }

    public setHotKey(hotKeys: Array<IHotKeyItem<Editor>>): void {
        this.plugin.initHotKey(hotKeys);
    }

    public getMask(): Mask {
        return this.plugin.getMask();
    }

    public getCanvas(): Canvas {
        return this.plugin.getCanvas();
    }

    public getZoom(): number {
        return this.getCanvas().getZoom();
    }

    public setZoom(zoom: number): void {
        this.getCanvas().setZoom(zoom);
    }

    public getHotKey(): HotKey {
        return this.plugin.getHotKey();
    }

    public getDragLimit(): number {
        return this.dragLimit;
    }

    public getDraftTemplate(): EditorTemplate {
        return this.draftTemplate;
    }

    public getStashTemplate(): EditorTemplate {
        return this.stashTemplate;
    }

    public registerTemplate(template: T): void {
        this.templateMap[template.id] = template;
    }

    public unregisterTemplate(template: T): void {

        const id = template.id;

        if (this.templateMap[id]) {
            delete this.templateMap[template.id];
        }
    }

    /**
     * 设置当前激活的画板编号
     *
     * @public
     * @param {string|null} templateId 画板编号
     * @param {boolean=} isSilent 是否静默更新
     */
    public setActiveTemplateId(templateId: string, isSilent: boolean = false): void {

        if (templateId === this.activeTemplateId) {
            return;
        }

        const oldId = this.activeTemplateId;
        this.activeTemplateId = templateId || '';

        if (oldId) {
            const oldTemplate = this.getTemplate(oldId);
            oldTemplate.setActiveBoardId(null, true);
            oldTemplate.setActiveBrickIds([], true);
            oldTemplate.emitActiveChange();
        }

        if (templateId) {
            const activeTemplate = this.getActiveTemplate();

            if (activeTemplate != null) {
                activeTemplate.emitActiveChange();
                activeTemplate.setActiveBoardId(null, isSilent);
            }

            if (!isSilent) {
                this.updateActiveBoard(this.getActiveBoardId());
            }
        }

        if (!isSilent) {
            this.emit('active-template-change', this.activeTemplateId);
            this.emitEditorChange();
        }
    }

    /**
     * 获取当前激活的页面编号
     */
    public getActiveTemplateId(): string {
        return this.activeTemplateId;
    }

    /**
     * 获取当前激活的画板编号
     */
    public getActiveBoardId(): string {

        if (!this.activeTemplateId) {
            return '';
        }

        const activeTemplate = this.getActiveTemplate();

        if (!activeTemplate) {
            return '';
        }

        return activeTemplate.getActiveBoardId() || '';
    }

    /**
     * 获取当前激活的组件编号集合
     */
    public getActiveBrickIds(): string[] {
        const template = this.getActiveTemplate();

        if (!template) {
            return [];
        }
        return template.getActiveBrickIds() || [];
    }

    /**
     * 获取当前激活的页面
     */
    public getActiveTemplate(): T | null {
        return this.templateMap[this.activeTemplateId] || null;
    }

    /**
     * 获取当前激活的画板
     */
    public getActiveBoard(): EditorBoard | null {
        const activeTemplate = this.getActiveTemplate();

        if (!activeTemplate) {
            return null;
        }

        return activeTemplate.getActiveBoard() || null;
    }

    /**
     * 获取当前激活的组件集合
     */
    public getActiveBricks(): EditorBrickGlobal[] {
        const template = this.getActiveTemplate();

        if (!template) {
            return [];
        }

        return template.getActiveBricks() || [];
    }

    /**
     * 获取画板数据
     */
    public getTemplate(templateId: string): T {

        if (!this.templateMap[templateId]) {
            throw new Error('template id = ' + templateId + ' is not exist');
        }

        return this.templateMap[templateId];
    }

    public getBrickConfigs(): IEditorBrickConfigs {
        return this.brickConfigs;
    }

    public getHistory(): History {
        return this.history;
    }

    public isRedoDisabled(): boolean {
        const history = this.getHistory();
        return history.isRedoDisabled();
    }

    public isUndoDisabled(): boolean {
        const history = this.getHistory();
        return history.isUndoDisabled();
    }

    public updateActiveBoard(boardId: string): void {
        this.emit('active-board-change', boardId);
        this.emitEditorChange();
    }

    public updateActiveBricks(brickIds: string[]): void {
        this.emit('active-brick-change', brickIds);
        this.emitEditorChange();
    }

    public emitEditorChange(): void {
        this.emit('editor-change');
    }

    public enableDragState(): void {
        // todo
    }

    public disableDragState(): void {
        // todo
    }
}
