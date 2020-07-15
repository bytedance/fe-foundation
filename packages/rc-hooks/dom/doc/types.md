# 内置类型
这里定义了一些常见的内置类型。

## Omit
从已知类型中，提出非指定Key的类型

* 定义 `type Omit<T, K> = Pick<T, Exclude<keyof T, K>>`
* 用法
    ```typescript
    
        import {Omit} from '@co-hooks/util'
      
        interface Demo {
            foo: string;
            bar: string;
            baz: string;
        }
        
        type DemoWithOutFoo = Omit<Demo, 'foo'> // {bar: string, baz: string}
        type DemoWithBaz = Omit<Demo, 'foo' | 'bar'> // {baz: string}
    ```
* 参考 
    - [中文](https://www.tslang.cn/docs/handbook/advanced-types.html)
    - [English](http://www.typescriptlang.org/docs/handbook/advanced-types.html)
    
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
    
   
## ComponentSize
定义了项目中统一的组件大小定义

* 定义 `type ComponentSize = 'xl' | 'lg' | 'md' | 'sm' | 'xs'`
* 释义
    - xl：特大号，不是所有组件都支持特大号，如不支持特大号与大号一致
    - lg：大号
    - md：中号，默认的正常大小
    - sm：小号
    - xs：特小号，不是所有组件都支持特小号，如不支持特小号与小号一致
