# RcGroup - 分组类元素
可以支持RadioGroup、CheckboxGroup、Tabs、Tag List等组件。
方便进行父子之间通信。

## API

# RcGroup
分组容器，处于同一个容器下的组件会被当成是一组，支持所有div元素支持的属性。

* 定义 `function RcGroup<T, P>(props: IRcGroupProps<T, P>): React.ReactNode`
* 类型 
    - IRcGroupProps `type IRcGroupProps<T, P> = UnionOmit<IGroupOptions<T, P>, HTMLAttributes<HTMLDivElement>>`
    - IGroupOptions `interface IGroupOptions<T, P> {disabled: boolean;extraProps: P;value: T[];onChange: (value: T[]) => void;}`
* 泛型参数
    - T 表示分组中值可能为的类型
    - P 表示所有可以在容器和子项之间共享的属性，设置在P中的属性会进行容器和子项的合并（子项目高于容器）**由于disabled影响行为，所以直接在IGroupOptions中做了定义**

* 用法

```typescript jsx
    import React, {useMemo, HTMLAttributes} from 'react'
    import {ComponentSize, UnionOmit} from '@co-hooks/util'
    import {RcGroup} from '@rc-hooks/group'

    interface ICheckboxButtonGroupShareOptions {
        size: ComponentSize; // 用于表示按钮大小
        type: string; // 用于表示按钮类型
    } 
    
    interface ICheckboxButtonGroup<T> extends Partial<ICheckboxButtonGroupShareOptions> {
        value: T[]
        onChange: (value: T[]) => void;
        disabled?: boolean;
    }
     
    type ICheckboxButtonGroupProps<T> = UnionOmit<ICheckboxButtonGroup<T>, HTMLAttributes<HTMLDivElement>>;

    function CheckboxButtonGroup<T>(props: ICheckboxButtonGroupProps<T>) {
        
        const {
            value,
            type = 'default',
            size = 'md',
            disabled = false,
            onChange,
            ...others
        } = props;
        
        const extraProps = useMemo(() => ({size, type}), [size, type]);
        
        return (
            <RcGroup<T, ICheckboxButtonGroupShareOptions>
                {...others}
                value={value}
                onChange={onChange}
                disabled={disabled}
                extraProps={extraProps}
            />
        )
    }
```
**由于要支持单选、多选、混选等多种情况，所有数值都以数组的形式提供，如须单值，可以如下自行封装相关属性**
```typescript jsx
    
    import {useCallback} from 'react'
    
    
    function RadioGroup<T>(props:{onChange: (value: T | null) => void}) {
    
         const onChange = useCallback((value: T[]) => {
              props.onChange(value.length ? value[0]: null);
          }, [props.onChange])
    }
```

* 参考
    - [UnionOmit](../rc-util/doc/types.md)
    - [ComponentSize](../rc-util/doc/types.md)

## useGroupItem
分组子项使用的钩子，可以用于获取子项目使用到的信息。
    
* 定义 `function useGroupItem<T, P>(props: IGroupItemOptions<T, P>): IGroupItemRenderProps<T, P>`
* 类型 
    - IGroupItemRenderProps `type IGroupItemRenderProps<T, P> = [UnionOmit<{checked: boolean; disabled: boolean}, P>, (checked: boolean) => void ]`
    - IGroupItemOptions `interface IGroupItemOptions<T, P> {disabled: boolean; extraProps: Partial<P>; group: string; free: boolean; value: T}`
* 泛型参数
    - T 表示分组中值可能为的类型
    - P 表示所有可以在容器和子项之间共享的属性，设置在P中的属性会进行容器和子项的合并（子项目高于容器）**由于disabled影响行为，所以直接在IGroupOptions中做了定义**
* 用法
```typescript jsx
    import React, {ButtonHTMLAttributes, useCallback, MouseEventHandler} from 'react'
    import {ComponentSize, UnionOmit} from '@co-hooks/util'
    import {useGroupItem} from '@rc-hooks/group'

    interface ICheckboxButtonGroupShareOptions {
        size: ComponentSize; // 用于表示按钮大小
        type: string; // 用于表示按钮类型
    } 
    
    interface ICheckboxButton<T> extends Partial<ICheckboxButtonGroupShareOptions> {
        value: T[]
        disabled?: boolean;
    }
     
    type ICheckboxButtonProps<T> = UnionOmit<ICheckboxButton<T>, ButtonHTMLAttributes<HTMLButtonElement>>;

    function CheckboxButton<T>(props: ICheckboxButtonProps<T>) {
        
        const {
            value,
            type, 
            size,
            disabled = false,
            onClick, // Button没有onChange事件，用onClick来模拟
            ...others
        } = props;
        
        const [group, onItemChange] = useGroupItem<T, ICheckboxButtonGroupShareOptions>({
            disabled,
            value,
            group: 'checkbox', // 所有的项目都在一个分组，用同一个就可以了
            free: false,
            // 这里有个partial可以传递部分属性
            extraProps:{
                size, 
                type
            }
        });
        
        // 省略了type size等样式处理函数，也可以单独封装一个组件来处理
        
        const onButtonClick = useCallback((e: MouseEventHandler<HTMLButtonElement>) => {
            
            if(onClick) {
                onClick(e);
            }
            
            // 对于checkbox来说，点一下翻转
            onItemChange(!group.checked);
        }, [onClick, onItemChange, group.checked]);
        
        return (
            <button {...others} onClick={onButtonClick}/>
        )
    }
```

* 参考
    - [UnionOmit](../rc-util/doc/types.md)
    - [ComponentSize](../rc-util/doc/types.md)


