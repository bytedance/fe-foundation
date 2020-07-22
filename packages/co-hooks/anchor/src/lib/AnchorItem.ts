/**
 * @file AnchorItem
 */
import {guid} from '@co-hooks/util';
import {getElementScroll, isClient} from '@co-hooks/dom';
import {Anchor} from './Anchor';

export interface IAnchorItemOptions {
    href?: string;
}

const hashMatcherRegx = /#([^#]+)$/;

export class AnchorItem {
    private readonly root: Anchor;

    private readonly parent: AnchorItem | null = null;

    private readonly id: string;

    private offsetTop: number = 0;

    private href: string = '';

    constructor(root: Anchor, parent: AnchorItem | null, id?: string) {
        this.root = root;
        this.parent = parent;
        this.id = id || guid();

        this.init();
    }

    public updateOptions(options: IAnchorItemOptions): void {
        const {href = ''} = options;

        if (href !== this.href) {
            this.href = href;
        }
    }

    public updateOffsetTop(isSilent: boolean = false): boolean {
        const container = this.root.getContainer();
        const href = this.href;

        if (!container) {
            return false;
        }

        if (hashMatcherRegx.exec(href)) {
            const target = isClient() ? document.querySelector(href) : null;

            if (!target) {
                return false;
            }

            let top = 0;
            if (container === document.body || container === document.documentElement) {
                top = target.getBoundingClientRect().top + getElementScroll(container).scrollTop;
            } else {
                top = target.getBoundingClientRect().top
                    - container.getBoundingClientRect().top + getElementScroll(container).scrollTop;
            }

            this.offsetTop = top;

            // 通知其他item也更新自己的offsetTop
            if (!isSilent) {
                this.root.updateAllItemOffsetTop(this.id);
            }
            return true;
        }

        return false;
    }

    public getOffsetTop(): number {
        return this.offsetTop;
    }

    public getId(): string {
        return this.id;
    }

    public getLevel(): number {
        let level = 1;

        return this.parent ? this.parent.getLevel() + level : level;
    }

    public dispose(): void {
        this.root.unregisterAnchorItem(this);
    }

    private init(): void {
        this.root.registerAnchorItem(this);
    }
}
