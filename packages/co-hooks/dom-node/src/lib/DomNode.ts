/**
 * @file Node 一个带路径的Dom树
 */

import {Emitter} from '@co-hooks/emitter';
import {guid} from '@co-hooks/util';

export type OptionalDomNode<T> = DomNode<T> | null;

export interface IDomNodeEvent<T> {
    valueChange: [T, T];
    childChange: [];
    attached: [];
    detached: [DomNode<T>];
}

/**
 * 一个带路径的Dom树
 *
 */
export class DomNode<T> extends Emitter<IDomNodeEvent<T>> {

    /**
     * 节点ID
     */
    public readonly id: string = guid();

    /**
     * 第一个子节点
     */
    public firstChild: OptionalDomNode<T> = null;

    /**
     * 最后一个子节点
     */
    public lastChild: OptionalDomNode<T> = null;

    /**
     * 左兄弟节点
     */
    public leftNode: OptionalDomNode<T> = null;

    /**
     * 右兄弟节点
     */
    public rightNode: OptionalDomNode<T> = null;

    /**
     * 父亲节点
     */
    public parentNode: OptionalDomNode<T> = null;

    // 当前组件的值
    private value: T;

    /**
     * 构造函数
     *
     * @param value 初始值
     * @param parentNode 父亲节点
     */
    constructor(value: T, parentNode: OptionalDomNode<T> = null) {

        super();

        this.parentNode = parentNode;
        this.value = value;

        // 如果有父亲组件
        if (parentNode) {
            parentNode.appendChild(this);
        }
    }

    /**
     * 获取当前组件存储的值
     *
     * @return 获取存储的值
     */
    public getValue(): T {
        return this.value;
    }

    /**
     * 设置当前组件存储的值
     */
    public setValue(value: T): void {

        if (value !== this.value) {
            const old = this.value;
            this.value = value;
            this.emit('valueChange', value, old);
        }
    }

    /**
     * 获取当前节点的节点路径
     *
     * @param filter 过滤函数，返回false的节点会被忽略
     */
    public getPathNodes(filter: (node: DomNode<T>) => boolean): Array<DomNode<T>> {

        const result: Array<DomNode<T>> = [];

        let node: OptionalDomNode<T> = this;

        while (node) {

            if (filter(node)) {
                result.unshift(node);
            }

            node = node.parentNode;
        }

        return result;
    }

    /**
     * 获取当前节点的节点标识
     *
     * @param processor 迭代函数，返回null会被忽略
     */
    public getPathKeys(processor: (node: DomNode<T>) => string | null): string[] {

        const result: string[] = [];

        let node: OptionalDomNode<T> = this;

        while (node) {

            const str = processor(node);

            if (str != null) {
                result.unshift(str);
            }

            node = node.parentNode;
        }

        return result;
    }

    /**
     * 删除当前节点
     *
     * @public
     */
    public remove(): void {
        this.removeNode();
    }

    /**
     * 追加节点
     *
     * @public
     * @param node node节点
     */
    public appendChild(node: DomNode<T>): void {

        const oldParentNode = node.parentNode;
        node.removeNode(true, oldParentNode === this);
        node.parentNode = this;

        if (this.lastChild == null) {
            this.lastChild = this.firstChild = node;
        } else {
            const lastNode = this.lastChild;

            this.lastChild = node;

            lastNode.rightNode = node;
            node.leftNode = lastNode;
        }

        if (!oldParentNode) {
            node.emit('attached');
        }

        this.emit('childChange');
    }

    /**
     * 删除孩子节点
     *
     * @public
     * @param node node节点
     */
    public removeChild(node: DomNode<T>): void {
        node.remove();
    }

    /**
     * 替换节点
     *
     * @public
     * @param node 要替换成的node节点
     * @param refNode 被替换的节点
     * @return 被替换后的节点
     */
    public replaceChild(node: DomNode<T>, refNode: DomNode<T>): OptionalDomNode<T> {

        if (!refNode || refNode.parentNode !== this) {
            throw new Error('replaceChild: refNode is null or not in current Node, place check the code.');
        }

        if (node === refNode) {
            return refNode;
        }

        // 获取下一个元素
        const next = refNode.rightNode;

        // 删除元素，一定会被删除，如果和当前元素在一个父亲里面，就不用触发事件了
        refNode.removeNode(false, refNode.parentNode === this);

        // 元素在这里面删除
        this.insertBefore(node, next);

        return refNode;
    }

    /**
     * 在节点前插入节点
     *
     * @public
     * @param node 要插入的节点
     * @param refNode 插入的相对位置的节点
     */
    public insertBefore(node: DomNode<T>, refNode?: OptionalDomNode<T>): void {

        if (refNode && refNode.parentNode !== this) {
            throw new Error('insertAfter: refNode is not in current Node, place check the code.');
        }

        const oldParentNode = node.parentNode;
        node.removeNode(true, oldParentNode === this);
        node.parentNode = this;

        // 相对节点不存在，则插入到当前节点的firstChild的位置
        if (refNode == null) {

            const firstChild = this.firstChild;

            this.firstChild = node;

            // 原firstChild = null，说明当前节点原来没有子节点
            if (firstChild == null) {
                this.lastChild = node;
            } else {
                firstChild.leftNode = node;
                node.rightNode = firstChild;
            }
        } else if (refNode === this.firstChild) {
            this.firstChild = node;
            node.rightNode = refNode;
            refNode.leftNode = node;
        } else {
            const leftNode = refNode.leftNode;

            if (leftNode) {
                leftNode.rightNode = node;
            }

            node.leftNode = leftNode;
            node.rightNode = refNode;
            refNode.leftNode = node;
        }

        if (!oldParentNode) {
            node.emit('attached');
        }

        this.emit('childChange');
    }

    /**
     * 在节点之后插入节点
     *
     * @public
     * @param node 要插入的node节点
     * @param refNode 插入的相对位置的节点
     */
    public insertAfter(node: DomNode<T>, refNode?: DomNode<T>): void {

        if (refNode && refNode.parentNode !== this) {
            throw new Error('insertAfter: refNode is not in current Node, place check the code.');
        }

        node.remove();
        node.parentNode = this;

        // 相对节点不存在，则插入到当前节点的lastChild的位置
        if (refNode == null || refNode === this.lastChild) {
            this.appendChild(node);
            return;
        }

        this.insertBefore(node, refNode.rightNode);
    }

    /**
     * 在指定位置插入节点
     *
     * @param node 要插入的节点
     * @param index 要插入的下标位置，不传默认插入到最后
     */
    public insert(node: DomNode<T>, index?: number): number {

        if (index == null) {
            this.appendChild(node);
            return this.getIndex(node);
        }

        let i = 0;
        let cur: DomNode<T> | null = this.firstChild;

        while (cur) {

            // 不能算自己
            if (i === index && cur !== node) {
                this.insertBefore(node, cur);
                return index;
            }

            i++;
            cur = cur.rightNode;
        }

        this.appendChild(node);
        return this.getIndex(node);
    }

    /**
     * 获取某节点在当前父节点的位置
     *
     * @public
     * @param  node 子节点
     * @return 位置索引
     */
    public getIndex(node: DomNode<T>): number {

        if (!node || node.parentNode !== this) {
            throw new Error('Node.getIndex: node is not in current Node, place check the code.');
        }

        let i = 0;
        let curNode = this.firstChild;

        while (curNode != null && node !== curNode) {
            i++;
            curNode = curNode.rightNode;
        }

        return i;
    }

    /**
     * 当前节点是否为空
     *
     * @public
     * @return 是否为空
     */
    public isEmpty(): boolean {
        return this.firstChild == null;
    }

    /**
     * 获取子孩子数组
     *
     * @public
     * @return 返回节点数组
     */
    public getChildNodes(): Array<DomNode<T>> {

        const nodes = [];
        let node = this.firstChild;

        while (node != null) {
            nodes.push(node);
            node = node.rightNode;
        }

        return nodes;
    }

    /**
     * 获取满足条件的子节点
     *
     * @param matcher 匹配器，返回null忽略，返回false表示不匹配，返回true表示匹配
     */
    public getSubNodes(matcher: (node: DomNode<T>) => boolean | null): Array<DomNode<T>> {

        const nodeList: Array<DomNode<T>> = this.getChildNodes();
        const matched: Array<DomNode<T>> = [];

        while (nodeList.length) {

            const node = nodeList[0];
            const type = matcher(node);

            nodeList.shift();

            if (type === null) {
                nodeList.unshift(...node.getChildNodes());
            } else if (type) {
                matched.push(node);
            }

        }

        return matched;
    }

    /**
     * 获取满足条件的第一个子节点
     *
     * @param matcher 匹配器，返回null忽略，返回false表示不匹配，返回true表示匹配
     */
    public getSubNode(matcher: (node: DomNode<T>) => boolean | null): OptionalDomNode<T> {

        const nodeList: Array<DomNode<T>> = this.getChildNodes();

        while (nodeList.length) {

            const node = nodeList[0];
            const type = matcher(node);

            if (type === null) {
                nodeList.push(...node.getChildNodes());
            } else if (type) {
                return node;
            }

            nodeList.shift();
        }

        return null;
    }

    private removeNode(isSilent: boolean = false, avoidParentChange: boolean = false): void {

        const {parentNode, leftNode, rightNode} = this;

        if (!parentNode) {
            return;
        }

        const {firstChild, lastChild} = parentNode;

        // 有可能存在当前节点即时firstChild也是lastChild
        if (this === firstChild) {
            parentNode.firstChild = rightNode;
        }

        if (this === lastChild) {
            parentNode.lastChild = leftNode;
        }

        if (leftNode) {
            leftNode.rightNode = rightNode;
        }

        if (rightNode) {
            rightNode.leftNode = leftNode;
        }

        this.parentNode = null;
        this.leftNode = null;
        this.rightNode = null;

        if (!isSilent) {

            // 自己被删除了
            this.emit('detached', parentNode);

            // 父亲报告孩子变化
            if (!avoidParentChange) {
                parentNode.emit('childChange');
            }
        }
    }
}
