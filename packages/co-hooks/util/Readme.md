# Util - 工具函数、通用类型
这里包含了很多通用的小函数和通用的类型定义

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
使用JSON.stringify来实现的复制。

* 定义 `function clone<T>(obj: T): T`
* 泛型参数
    - T 表示分组要克隆值的类型，通常不需要传递，利用TypeScript推导

* 用法
    ```typescript jsx
    import {clone} from '@co-hooks/util'

    clone(1); // 1
    clone('abc'); // abc
    ```
## deepClone
克隆任何对象，支持函数等非JSON类型

* 定义 `function deepClone<T>(obj: T): T`
* 泛型参数
    - T 表示分组要克隆值的类型，通常不需要传递，利用TypeScript推导
* 用法
    ```typescript jsx
    import {deepClone} from '@co-hooks/util'

    deepClone(1); // 1
    deepClone('abc'); // abc
    const fn = deepClone(() => 1);
    fn() // 1
    ```
## UnionOmit
一个安全的交叉类型，UnionOmit会交叉两个类型，当名称有冲突的时，选取第一个，而不是报错。


* 定义 `UnionOmit<T, K> = T & Omit<K, keyof T>`
* 用法
    ```typescript

        import {UnionOmit} from '@co-hooks/util'

        interface Demo {
            foo: string;
            bar: string;
        }

        interface Other {
            foo: number;
            baz: string;
        }

        type DemoUnionOther = UnionOmit<Demo, Other> // {foo: sting, bar: string; baz: string}
        type OtherUnionDemo = UnionOmit<Other, Demo> // {foo: number, bar: string; baz: string}
    ```
