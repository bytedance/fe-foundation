# 通用钩子
这里定义了一些常用的钩子。

## useUpdate
模拟hooks不支持的useUpdate

* 定义 `function useUpdate(): () => void`
* 用法
    ```typescript jsx
    import {useEffect} from 'react'
    import {useUpdate} from '@co-hooks/util'
  
    function DemoComponent() {
    
        const update = useUpdate();
      
        useEffect(() => {
            // someting effect
            update();  
        })  
    }
      
    ```
 
## useIsMounted
一个用于判断组件是否加载完成的钩子，这个钩子会在组件mounted的时候，执行一次组件刷新。


* 定义 `function useIsMounted(): boolean`
* 用法
    ```typescript jsx
    import React from 'react'
    import {useIsMounted} from '@co-hooks/util'
  
    function DemoComponent() {
    
        const isMounted = useIsMounted();
      
        return (
            <div>{isMounted ? '加载已经完成' : '加载中'}</div>  
        )
    }    
    ```
    
   
## useRefGetter
给予变量一个可以一直获取最新值的函数，用于解决hooks无法更新闭包变量的问题

* 定义 `function useRefGetter<T>(value: T): RefGetter<T>`
* 类型 `type RefGetter<T> = () => T`
* 泛型
    - T 需要缓存的对应类型
* 用法
    ```typescript jsx
    import React, {useCallback, useEffect} from 'react'
    import {useRefGetter} from '@co-hooks/util'
  
    interface IDemoProps {
        onChange: () => void  
    }
  
    function DemoComponent(props: IDemoProps) {
    
        const onChange = useRefGetter(props.onChange);
          
        // 如果绑定和解绑成本比较高，这样的逻辑会有更好的性能
        useEffect(() => {
            // bind something callback
            onChange();
        },[]);
      
        // 另外一种实现方案是（如果绑定是低成本的，可以用这样的方法）
        useEffect(() => {
            // bind something callback
            props.onChange();
            return () => {
                // 解绑  
            }
        },[props.onChange])
    }    
    ```
    
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
    
