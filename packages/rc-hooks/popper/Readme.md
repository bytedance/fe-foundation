# RcPopper 一 气泡浮层

## API
属性 | 说明 | 类型 | 默认值
-----|-----|-----|------
show | 是否显示，可选 | boolean | `false`
trigger | 触发方式 | IRcTrigger | `hover`
placement | 定位方式，必填 | IRcPlacement | -
offset | 浮层相对偏移量 | IOffset | -
preventOverflow | 是否碰撞反向 | boolean | `true`
overflowBoundaries | 碰撞边界 | IOverFlowBoundaries | -
arrow | 是否有箭头 | boolean | `false`
arrowOffset | 箭头偏移量 | IOffset | -
getArrow | arrow内容渲染方法 | (arrowInfo: IArrowInfo, touch: ITouch) => React.ReactNode | -
getPopper | popper内容渲染方法 | () => React.ReactNode | -
hideToDestory | 是否隐藏是销毁 | boolean | `false`
lazyInit | 是否第一次trigger时渲染 | boolean | `false`
zIndex | 浮层的zIndex，选填 | number | -
className | popper className | string | -
refClassName | reference className | string | -
children | reference内容 | Function/ReactNode | -
onShow | show事件，选填 | Function | -
onHide | hide事件，选填 | Function | -
onFocus | focus事件,`trigger = focus`时触发，选填 | Function | -
onBlur | blur事件,`trigger = focus`时触发，选填 | Function | -
hideDelay | 隐藏等待时间，选填，毫秒 | number | -

## 类型 定义
```typescript jsx
import {CSSProperties} from 'react';

export type IRcTrigger = 'click' | 'hover' | 'focus' | 'manual';

export type IRcPlacementLeft = 'left-start' | 'left' | 'left-end';
export type IRcPlacementRight = 'right-start' | 'right' | 'right-end';
export type IRcPlacementTop = 'top-start' | 'top' | 'top-end';
export type IRcPlacementBottom = 'bottom-start' | 'bottom' | 'bottom-end';

export type IRcPlacement = IRcPlacementLeft | IRcPlacementRight | IRcPlacementTop | IRcPlacementBottom;

export interface ITouch {
    touchX?: boolean;
    touchY?: boolean;
}

export interface IOverFlowBoundaries {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
}

export interface IArrowInfo {
    arrowStyle: CSSProperties;
    arrowDirection: string;
}

```

## 用法
```typescript jsx
import React, {CSSProperties, useCallback, useState} from 'react';
import {RcPopper, IArrowInfo} from '@rc-hooks/popper';
import './demo.less';

export default (props: {}) => {
    const [showls, setShowLS] = useState(false);

    const getArrow = useCallback((arrowInfo: IArrowInfo) => {
        const {arrowDirection} = arrowInfo;
        const arrowStyle: CSSProperties = {
            borderWidth: '5px',
            width: 0,
            height: 0,
            fontSize: 0,
            lineHeight: 0,
            borderStyle: 'solid',
            display: 'block'
        };
        switch (arrowDirection) {
            case 'top':
                Object.assign(arrowStyle, {
                    borderColor: 'transparent transparent #ccc transparent'
                });
                break;
            case 'bottom':
                Object.assign(arrowStyle, {
                    borderColor: '#ccc transparent transparent transparent'
                });
                break;
            case 'left':
                Object.assign(arrowStyle, {
                    borderColor: 'transparent #ccc transparent transparent'
                });
                break;
            case 'right':
                Object.assign(arrowStyle, {
                    borderColor: 'transparent transparent transparent #ccc'
                });
                break;
        }

        return (
            <span style={arrowStyle} />
        );
    }, []);

    return (
        <div className="dialog-demo">
            <div style={{marginBottom: '50px'}}>以下popper都是lazyInit的, hover会在隐藏时销毁，click的不会销毁</div>
            <div className="part">
                <RcPopper
                    show={showls}
                    trigger="click"
                    placement="left-start"
                    getPopper="提示文字"
                    lazyInit={true}
                    arrow={true}
                    getArrow={getArrow}
                    arrowOffset={{x: 0, y: 5}}
                    offset={{x: -10, y: 0}}
                    onShow={() => setShowLS(true)}
                    onHide={() => setShowLS(false)}
                >
                    <Button>click 左上</Button>
                </RcPopper>
            </div>
        </div>
    );
};
```
