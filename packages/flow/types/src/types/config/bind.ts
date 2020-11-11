/**
 * @file bind 绑定类型的定义
 */

// 绑定类型
export enum BindType {
    VAR = 0, // 变量绑定
    EXPRESSION = 1, // 表达式绑定
    FUNC = 2, // 函数绑定
    CONST = 3 // 常量
}

// 变量绑定
export interface IBindVar {
    bindType: BindType.VAR;
    bindKey: string;
}

// 表达式类绑定
export interface IBindExpression {
    bindType: BindType.EXPRESSION;
    bindJs: string; // 绑定的表达式
}

// 函数类绑定
export interface IBindFunc {
    bindType: BindType.FUNC;
    func: string; // 绑定的函数名字
    isWatch: boolean; // 是否监控
    watchKeys: string; // 监控的字段
    async: boolean; // 是不是异步函数（默认是false，函数会被编译进去）
}

export interface IBindConst {
    bindType: BindType.CONST;
    data: unknown; // 绑定的数据，要为JSON格式
}

export type IBindValue = IBindVar | IBindExpression | IBindFunc | IBindConst;

export type IBindObject<T> = {
    __bind__?: {
        [K in keyof T]?: IBindValue
    };
} & {
    [K in keyof T]: IBindConfig<T[K]>;
};


export type IBindArray<T> = T extends Array<infer K> ? Array<IBindConfig<K>> : never;

export type IBindConfig<T> = T extends unknown[] ? IBindArray<T> : T extends object ? IBindObject<T> : T;

