/**
 * @file Notification 通知列表
 */

import {IRcPosition} from '@rc-hooks/dialog';
import React, {ComponentType} from 'react';
import {guid} from '@co-hooks/util';
import {Emitter} from '@co-hooks/emitter';
import ReactDOM from 'react-dom';
import {IRcNotificationContainerProps, RcNotificationContainer} from '../components/RcNotificationContainer';
import {NotificationContext} from '../context/notification';

export interface INoticeBaseProps {
    onClose?: () => void;
}

type AnimationConfig<T> = IRcNotificationContainerProps<T>['animation'];

export interface INotificationOptions<T> {
    maxCount?: number;
    space?: number;
    placement: {[key: string]: IRcPosition};
    animation?: {[key: string]: AnimationConfig<T & INoticeBaseProps>};
    Component: ComponentType<T & INoticeBaseProps>;
}

export interface INotice<T> {
    options: T & INoticeBaseProps;
    placement: string;
    duration?: number;
    onClose: () => void;
    key: string;
}

export interface INotificationInstanceEvents {
    change: [string];
}

export interface INotificationOpened {
    (): void;

    then: Promise<void>['then'];

    catch: Promise<void>['catch'];
}

export class NotificationInstance<T> extends Emitter<INotificationInstanceEvents> {

    // 提示之间的
    public space: number;

    // 最大显示数量
    public maxCount: number;

    public animation: {[key: string]: AnimationConfig<T & INoticeBaseProps>};

    // 支持出现的位置信息
    public placement: {[key: string]: IRcPosition};

    // 渲染用的容器
    public Component: ComponentType<T & INoticeBaseProps>;

    // 通知列表
    public notices: Array<INotice<T & INoticeBaseProps>> = [];

    // 渲染容器
    public container: HTMLDivElement = document.createElement('div');

    // 当前是否已经装载
    private mounted: boolean = false;

    // 当前是否已经销毁
    private disposed: boolean = false;

    constructor(conf: INotificationOptions<T>) {

        super();

        const {
            maxCount = 0,
            space = 0,
            Component,
            animation = {},
            placement
        } = conf;

        this.maxCount = maxCount;
        this.Component = Component;
        this.animation = animation;
        this.placement = placement;
        this.space = space;
    }

    public mount(): void {

        const {
            placement,
            mounted,
            space,
            disposed,
            Component,
            animation,
            container
        } = this;

        if (document.body.lastChild !== container) {
            document.body.appendChild(container);
        }

        if (mounted || disposed) {
            return;
        }

        this.mounted = true;

        const notifications = Object.keys(placement).map(key => (
            <RcNotificationContainer
                key={key}
                container={container}
                Component={Component}
                space={space}
                placement={key}
                position={placement[key]}
                animation={animation[key]}
            />
        ));

        ReactDOM.render((
            <NotificationContext.Provider value={this as NotificationInstance<unknown>}>
                {notifications}
            </NotificationContext.Provider>
        ), container);
    }

    public open(
        notice: T & INoticeBaseProps,
        placement: string,
        duration: number = 0,
        key: string = guid()
    ): INotificationOpened {

        const promise = new Promise<void>(resolve => {

            const {onClose} = notice;
            const onNoticeClose = (): void => {

                const removedNotice = this.removeNoticeByKey(key);

                if (removedNotice == null) {
                    return;
                }

                onClose && onClose();
                resolve();
                this.emit('change', removedNotice.placement);
            };

            const needUpdatePlacementList = [placement];
            const currentNotice = this.removeNoticeByKey(key);

            if (currentNotice) {

                currentNotice.options.onClose && currentNotice.options.onClose();

                if (needUpdatePlacementList.indexOf(currentNotice.placement) < 0) {
                    needUpdatePlacementList.push(currentNotice.placement);
                }
            }

            this.notices.push({
                options: notice,
                key: key,
                placement,
                duration,
                onClose: onNoticeClose
            });

            // 最大条数限制
            if (this.maxCount > 0 && this.notices.length > this.maxCount) {

                const removedNoticeList = this.notices.splice(0, this.notices.length - this.maxCount);

                removedNoticeList.forEach(item => {

                    item.options.onClose && item.options.onClose();

                    if (needUpdatePlacementList.indexOf(item.placement) < 0) {
                        needUpdatePlacementList.push(item.placement);
                    }
                });
            }

            needUpdatePlacementList.forEach(item => {
                this.emit('change', item);
            });

            this.mount();
        });

        const fn: INotificationOpened = (): void => this.close(key);
        fn.then = (...args) => promise.then(...args);
        fn.catch = (...args) => promise.then(...args);

        return fn;
    }

    public close(key: string): void {

        const notice = this.notices.find(item => item.key === key);

        // 直接调用onClose方法
        notice && notice.onClose();
    }

    public dispose(): void {

        if (this.mounted) {
            ReactDOM.unmountComponentAtNode(this.container);
            document.body.removeChild(this.container);
        }
        this.notices = [];
        this.disposed = true;
    }

    // 获取当前Notification支持的Notice
    public getNotices(placement: string): Array<INotice<T & INoticeBaseProps>> {
        return this.notices.filter(item => item.placement === placement);
    }

    private getIndexByNoticeKey(key: string): number {
        return this.notices.findIndex(item => item.key === key);
    }

    private removeNoticeByKey(key: string): INotice<T & INoticeBaseProps> | null {

        const index = this.getIndexByNoticeKey(key);

        if (index < 0) {
            return null;
        }

        const [notice] = this.notices.splice(index, 1);

        return notice;
    }
}
