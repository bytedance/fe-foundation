# Dialog 一 定位

## API
属性 | 说明 | 类型 | 默认值
-----|-----|-----|------
show | 是否显示，可选 | boolean | `false`
getContainer | 获取父容器的方法，可选，如果不传默认是`document.body` | function | -
mask | 是否显示遮罩层，可选 | boolean | `false`
maskClassName | mask的className，可选 | string | -
onMaskClick | mask点击事件，可选 | function | -
zIndex | style.zIndex，可选 | number | -
children | 浮层内容，可选 | React.ReactNode | -
& IRcPosition | position相关配置，参考`IRcPosition`定义 | - | -

## IRcPosition 定义
IRcPosition一共分成 16种情况，横纵方向 4 * 4
```typescript jsx
    export type IRcPositionHorizontal = 'left' | 'center' | 'right' | 'dock';

    export type IRcPositionVertical = 'top' | 'center' | 'bottom' | 'dock';

    interface IRcHorizontal {
        horizontal: IRcPositionHorizontal;
        left?: number;
        right?: number;
    }

    interface IRcVertical {
        vertical: IRcPositionVertical;
        top?: number;
        bottom?: number;
    }

    export type IRcPosition = IRcHorizontal & IRcVertical;
```

## 用法
```typescript jsx
    import React, {useState, useRef} from 'react';
    import {RcDialog} from '../src';
    import {useContainer} from '@co-hooks/util';
    import {Button} from '../../ui';

    export default (props: {}) => {
        const divRef = useRef<HTMLDivElement>(null);

        const [show, setshow] = useState(false);

        const getContainer = useContainer(divRef);

        const maskStyle = {
            background: 'rgba(0, 0, 0, .2)'
        };

        return (
            <div>
                <Button onClick={() => setshow(true)} >指定父级</Button>

                <div className="refDiv" ref={divRef} style={{width: '200px', height: '200px', border: '1px solid #ccc'}}>
                    有内容的div
                </div>

                <RcDialog
                    show={show}
                    getContainer={getContainer}
                    horizontal="center"
                    vertical="center"
                    mask={true}
                    onMaskClick={() => setshow(false)}
                    maskStyle={maskStyle}
                >
                    我是用了指定父级的浮层
                </RcDialog>
            </div>
        );
    };
```
