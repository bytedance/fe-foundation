# Dom - Dom相关Hooks和操作函数

## useWindowSize
监控窗体大小变化

* 定义 `function useWindowSize(onResize?: ResizeHandler): IElementSize `
* 类型
    - `type ResizeHandler = (size: IElementSize) => void`
    - `interface IElementSize {width: number; height: number;}`
* 用法
    ```typescript jsx
    import React from 'react'
    import {useWindowSize, IElementSize} from '@co-hooks/util'

    interface IDemoProps {
        onChange: (size: IElementSize) => void
    }

    function DemoComponent(props: IDemoProps) {

        const size = useWindowSize(props.onChange);

        return (
            <div>{size.width} * {size.height}</div>
        )
    }
    ```

## getZIndex
获取一个新的用于展示的zIndex，建议弹层每次show的时候，更新一下，保证不被挡住

* 定义 `function getZIndex(): number`
* 用法
    ```typescript jsx
    import React from 'react'
    import {getZIndex} from '@co-hooks/util'

    function DemoComponent() {

        const zIndex = getZIndex();

        return (
            <div style={{zIndex}}/>
        )
    }

    ```
