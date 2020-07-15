# 工具函数
这里定义了一些常用的工具函数，如果有相关需求一定要引工具函数。

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
 
## guid
生成一个全局唯一的字符串，如果需要id在每一次请求的时候不变，需要要useMemo。


* 定义 `function guid(): string`
* 用法
    ```typescript jsx
    import React, {useMemo} from 'react'
    import {guid} from '@co-hooks/util'
  
    function DemoComponent() {
    
        const id = useMemo(() => guid(), []);
      
        return (
            <div id={id}/> 
        )
    }    
    ```
    
   
## type
获取一个变量的系统预设类型，不推荐使用此函数，因为他会影响typescript的类型推导。
对于基础类型建议使用typeof，对于系统类型，比如数组，用Array.isArray，
这样可以获取更好的typescript支持。

* 定义 `function type(obj: any): string`
* 用法
    ```typescript jsx
    import {type} from '@co-hooks/util'

    type(1); // number
    type(''); // string
    type(Date.now()) // date
    ```
    
## clone
克隆一个可以转换为json的对象，使用了内置的api。

* 定义 `function clone<T>(obj: T): T`
* 用法
    ```typescript jsx
    import {clone} from '@co-hooks/util'

    clone(1); // 1
    clone('abc'); // abc
    ```
    
## clone
克隆一个可以转换为json的对象，使用了内置的api。

* 定义 `function clone<T>(obj: T): T`
* 用法
    ```typescript jsx
    import {clone} from '@co-hooks/util'

    clone(1); // 1
    clone('abc'); // abc
    ```
