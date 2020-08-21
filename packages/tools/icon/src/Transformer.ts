/**
 * @file Transformer 转化器
*/

import {
    ISvgAttr,
    ISvgElementInfo,
    ISvgInfo,
    ISvgInlineStyleAttr,
    ISvgStyleAttr,
    ISvgStyleKeyframesInfo, ISvgStyleRuleInfo, ISvgStyleSelector, SvgTags
} from './types';

export interface ITransformProgramPluginItem {
    // 进入时变换，返回一个新的ISvgInfo
    enter: (elem: ISvgInfo) => ISvgInfo;
    // 退出时变换，返回一个新的ISvgInfo，与进入的区别在于，退出时所以属性和孩子都已经处理过了。
    exit: (elem: ISvgInfo) => ISvgInfo;
}

export interface ITransformPluginItem {
    // 进入时变换，返回一个新的ISvgInfo，返回null将删除节点
    enter: (elem: ISvgElementInfo) => ISvgElementInfo | null;
    // 属性变换，返回一个新的ISvgAttr，返回null将删除属性
    attr: (attr: ISvgAttr, elem: ISvgElementInfo) => ISvgAttr | null;
    // 行内样式处理，返回一个新的ISvgInlineStyleAttr，返回null将删除样式
    style: (attr: ISvgInlineStyleAttr, elem: ISvgElementInfo) => ISvgInlineStyleAttr | null;
    // 退出时变换，返回一个新的ISvgInfo，返回null将删除节点，与进入的区别在于，退出时所以属性和孩子都已经处理过了。
    exit: (elem: ISvgElementInfo) => ISvgElementInfo | null;
}

export interface IRuleTransformPluginItem {
    // 进入时变换，返回一个新的ISvgInfo，返回null将删除节点
    enter: (elem: ISvgStyleRuleInfo) => ISvgStyleRuleInfo | null;

    // 选择器变换，返回一个新的selector，返回null将删除属性
    selector: (attr: ISvgStyleSelector, elem: ISvgStyleRuleInfo) => ISvgStyleSelector | null;

    // 属性变换，返回一个新的ISvgAttr，返回null将删除属性
    attr: (attr: ISvgStyleAttr, elem: ISvgStyleRuleInfo) => ISvgStyleAttr | null;

    // 退出时变换，返回一个新的ISvgInfo，返回null将删除节点，与进入的区别在于，退出时所以属性和孩子都已经处理过了。
    exit: (elem: ISvgStyleRuleInfo) => ISvgStyleRuleInfo | null;
}

export interface IKeyframesTransformPluginItem {
    // 进入时变换，返回一个新的ISvgInfo，返回null将删除节点
    enter: (elem: ISvgStyleKeyframesInfo) => ISvgStyleKeyframesInfo | null;

    // 选择器变换，返回一个新的selector，返回null将删除属性
    selector: (attr: ISvgStyleSelector, elem: ISvgStyleKeyframesInfo) => ISvgStyleSelector | null;

    // 退出时变换，返回一个新的ISvgInfo，返回null将删除节点，与进入的区别在于，退出时所以属性和孩子都已经处理过了。
    exit: (elem: ISvgStyleKeyframesInfo) => ISvgStyleKeyframesInfo | null;
}

// 标签名
// 支持用*表示全部
export interface ITransformPlugin
    extends Partial<Record<SvgTags, Partial<ITransformPluginItem>>>, Partial<ITransformProgramPluginItem> {
    '*'?: Partial<ITransformPluginItem>;
    'rule'?: Partial<IRuleTransformPluginItem>;
    'keyframes'?: Partial<IKeyframesTransformPluginItem>;
}

export interface ITransformOptions {
    info: ISvgInfo;
    plugins: ITransformPlugin[];
}

export const noopTransformer = <T>(item: T): T => item;

/**
 * 转换器
 *
 * @desc 默认不进行转化
 */
export class Transformer {

    protected plugins: ITransformPlugin[];
    protected info: ISvgInfo;
    protected cache: Record<string, unknown> = {};

    constructor(options: ITransformOptions) {

        this.info = options.info;
        this.plugins = options.plugins;
    }

    public process(): ISvgInfo {

        const plugins = this.processProgramPlugin();

        let info = this.info;

        // 正序执行进入
        for (const plugin of plugins) {
            info = plugin.enter(info);
        }

        const {element, style} = info;
        const svg = this.processElement(element);
        const keyframes = style.keyframes.map(keyframe => this.processStyleKeyframe(keyframe));
        const rules = style.rules.map(rule => this.processStyleRule(rule));

        if (svg == null) {
            throw new Error('svg标签不可返回空');
        }

        info = {
            element: svg,
            style: {
                keyframes: keyframes.filter(item => !!item) as ISvgStyleKeyframesInfo[],
                rules: rules.filter(item => !!item) as ISvgStyleRuleInfo[]
            }
        };

        // 倒序执行退出
        for (let i = plugins.length - 1; i >= 0; i--) {
            info = plugins[i].exit(info);
        }

        return info;
    }

    // 处理一个元素
    protected processElement(info: ISvgElementInfo): ISvgElementInfo | null {

        const plugins = this.processTagPlugin(info.type);

        // 正序执行进入
        for (const plugin of plugins) {

            const result = plugin.enter(info);

            if (result == null) {
                return null;
            }

            info = result;
        }

        // 执行属性处理
        const newAttrs: ISvgAttr[] = [];

        info.attrs.forEach(attr => {

            // 正序执行进入
            for (const plugin of plugins) {

                const result = plugin.attr(attr, info);

                if (result == null) {
                    return;
                }

                attr = result;
            }

            newAttrs.push(attr);
        });

        info.attrs = newAttrs;

        const newStyle: ISvgInlineStyleAttr[] = [];

        info.style.forEach(attr => {
            // 正序执行进入
            for (const plugin of plugins) {

                const result = plugin.style(attr, info);

                if (result == null) {
                    return;
                }

                attr = result;
            }

            newStyle.push(attr);
        });

        info.style = newStyle;

        // 执行处理孩子
        const newChildren: ISvgElementInfo[] = [];

        info.children.forEach(child => {

            // 更新一下父元素的引用
            child.parent = info;

            // 正序执行进入
            const result = this.processElement(child);

            if (result == null) {
                return;
            }

            newChildren.push(result);
        });

        info.children = newChildren;

        // 倒序执行退出
        for (let i = plugins.length - 1; i >= 0; i--) {

            const result = plugins[i].exit(info);

            if (result == null) {
                return null;
            }

            info = result;
        }

        return info;
    }

    private processStyleKeyframe(keyframe: ISvgStyleKeyframesInfo): ISvgStyleKeyframesInfo | null {

        const plugins = this.processStyleKeyframePlugin();

        // 正序执行进入
        for (const plugin of plugins) {

            const result = plugin.enter(keyframe);

            if (result == null) {
                return null;
            }

            keyframe = result;
        }

        // 执行属性变换
        for (const plugin of plugins) {

            const result = plugin.selector(keyframe.selector, keyframe);

            // 删除了selector和删除没区别
            if (result == null) {
                return null;
            }

            keyframe.selector = result;
        }

        const newRules: ISvgStyleRuleInfo[] = [];

        keyframe.rules.forEach(rule => {
            const result = this.processStyleRule(rule);

            if (result == null) {
                return;
            }

            newRules.push(result);
        });

        keyframe.rules = newRules;

        // 倒序执行退出
        for (let i = plugins.length - 1; i >= 0; i--) {

            const result = plugins[i].exit(keyframe);

            if (result == null) {
                return null;
            }

            keyframe = result;
        }

        return keyframe;
    }

    private processStyleRule(rule: ISvgStyleRuleInfo): ISvgStyleRuleInfo | null {

        const plugins = this.processStyleRulePlugin();

        // 正序执行进入
        for (let plugin of plugins) {

            const result = plugin.enter(rule);

            if (result == null) {
                return null;
            }

            rule = result;
        }

        const selector = this.processStyleRuleSelector(rule.selector, rule, plugins);

        if (selector == null) {
            return null;
        }

        rule.selector = selector;

        const newAttrs: ISvgStyleAttr[] = [];

        rule.attrs.forEach(attr => {

            let res: ISvgStyleAttr | null = attr;

            for (let plugin of plugins) {

                res = plugin.attr(res, attr.owner);

                if (res == null) {
                    return null;
                }
            }

            newAttrs.push(res);
        });

        rule.attrs = newAttrs;

        // 倒序执行退出
        for (let i = plugins.length - 1; i >= 0; i--) {

            const result = plugins[i].exit(rule);

            if (result == null) {
                return null;
            }

            rule = result;
        }

        return rule;
    }

    private processTagPlugin(tag: SvgTags): ITransformPluginItem[] {

        if (this.cache[tag]) {
            return this.cache[tag] as ITransformPluginItem[];
        }

        const result: ITransformPluginItem[] = this.cache[tag] = [];

        // 首先循环所有插件
        this.plugins.forEach(plugin => {

            const tagPlugin = plugin[tag];
            const mapPlugin = plugin['*'];
            if (tagPlugin != null) {
                result.push({
                    enter: tagPlugin.enter || noopTransformer,
                    attr: tagPlugin.attr || noopTransformer,
                    style: tagPlugin.style || noopTransformer,
                    exit: tagPlugin.exit || noopTransformer
                });
            }

            if (mapPlugin != null) {
                result.push({
                    enter: mapPlugin.enter || noopTransformer,
                    attr: mapPlugin.attr || noopTransformer,
                    style: mapPlugin.style || noopTransformer,
                    exit: mapPlugin.exit || noopTransformer
                });
            }
        });

        return result;
    }

    private processStyleKeyframePlugin(): IKeyframesTransformPluginItem[] {

        if (this.cache.keyframes) {
            return this.cache.keyframes as IKeyframesTransformPluginItem[];
        }

        const result: IKeyframesTransformPluginItem[] = this.cache.keyframes = [];

        this.plugins.forEach(item => {
            const plugin = item.keyframes;
            if (plugin) {
                result.push({
                    enter: plugin.enter || noopTransformer,
                    selector: plugin.selector || noopTransformer,
                    exit: plugin.exit || noopTransformer
                });
            }
        });

        return result;
    }

    private processStyleRulePlugin(): IRuleTransformPluginItem[] {

        if (this.cache.rules) {
            return this.cache.rules as IRuleTransformPluginItem[];
        }

        const result: IRuleTransformPluginItem[] = this.cache.rules = [];

        this.plugins.forEach(item => {

            const plugin = item.rule;

            if (plugin) {
                result.push({
                    enter: plugin.enter || noopTransformer,
                    attr: plugin.attr || noopTransformer,
                    selector: plugin.selector || noopTransformer,
                    exit: plugin.exit || noopTransformer
                });
            }
        });

        return result;
    }

    private processProgramPlugin(): ITransformProgramPluginItem[] {

        if (this.cache.program) {
            return this.cache.program as ITransformProgramPluginItem[];
        }

        const result: ITransformProgramPluginItem[] = this.cache.program = [];

        this.plugins.forEach(item => {
            result.push({
                enter: item.enter || noopTransformer,
                exit: item.exit || noopTransformer
            });
        });

        return result;
    }

    private processStyleRuleSelector(
        selector: ISvgStyleSelector[][],
        rule: ISvgStyleRuleInfo,
        plugins: IRuleTransformPluginItem[]
    ): ISvgStyleSelector[][] | null {

        const list: ISvgStyleSelector[][] = [];

        selector.forEach(item => {

            const result = this.processStyleRuleSelectorList(item, rule, plugins);

            // 删除了selector和删除没区别
            if (result == null) {
                return null;
            }

            list.push(result);
        });

        return list.length ? list : null;
    }

    private processStyleRuleSelectorList(
        selector: ISvgStyleSelector[],
        rule: ISvgStyleRuleInfo,
        plugins: IRuleTransformPluginItem[]
    ): ISvgStyleSelector[] | null {

        const list: ISvgStyleSelector[] = [];

        selector.forEach(item => {

            const result = this.processStyleRuleSelectorItem(item, rule, plugins);

            // 删除了selector和删除没区别
            if (result == null) {
                return null;
            }

            list.push(result);
        });

        return list.length ? list : null;
    }

    private processStyleRuleSelectorItem(
        selector: ISvgStyleSelector,
        rule: ISvgStyleRuleInfo,
        plugins: IRuleTransformPluginItem[]
    ): ISvgStyleSelector | null {

        // 执行属性变换
        for (const plugin of plugins) {

            const result = plugin.selector(selector, rule);

            // 删除了selector和删除没区别
            if (result == null) {
                return null;
            }

            selector = result;
        }

        return selector;
    }
}

export function transform(info: ISvgInfo, plugins: ITransformPlugin[]): ISvgInfo {

    const transformer = new Transformer({
        info,
        plugins
    });

    return transformer.process();
}
