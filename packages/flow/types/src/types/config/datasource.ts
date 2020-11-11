/**
 * @file datasource 数据源类型定义
 */
//
// // 数据源类型
// export enum DatasourceType {
//     LOCAL = 'local',
//     REMOTE = 'remote',
//     BIND = 'bind',
//     DIY = 'diy'
// }
//
// // 请求的方式
// export enum DatasourceMethodType {
//     GET = 'get',
//     POST = 'post',
//     PUT = 'put',
//     DELETE = 'delete'
// }
//
// // 参数格式
// export enum DatasourceContentType {
//     FormData = 'form',
//     JSON = 'json'
// }
//
// // 本地数据源
// export interface IDatasourceLocalConfig<V, DS> {
//
//     type: DatasourceType.LOCAL;
//
//     // 是否提供静态的数据源
//     useStaticDatasource: boolean;
//
//     // 是否提供静态的数据源
//     hasDefaultValue: boolean;
//
//     // 必须是合法的JSON类型
//     data: DS;
//
//     // 默认值
//     defaultValue?: V;
// }
//
// // 远程数据源
// export interface IDatasourceRemoteConfig<V, DS> {
//
//     type: DatasourceType.REMOTE;
//
//     // 是否提供静态的数据源
//     useStaticDatasource: boolean;
//
//     // 是否提供静态的数据源
//     hasDefaultValue: boolean;
//
//     // 必须是合法的JSON类型
//     data: DS;
//
//     // 默认值
//     defaultValue?: V;
//
//     // 请求的类型
//     method: DatasourceMethodType;
//
//     // 请求的网址（支持插值）
//     url: string;
//
//     // 请求是否缓存
//     cacheable: boolean;
//
//     // 参数格式
//     encode: DatasourceContentType;
//
//     // 请求的参数（支持插值，如果encode选择的是json，会按js解析，不然按字符串解析）
//     params: string;
// }
//
// // 绑定变量数据源
// export interface IDatasourceBindVarConfig<V, DS> {
//
//     type: DatasourceType.BIND;
//
//     // 是否提供静态的数据源
//     useStaticDatasource: boolean;
//
//     // 是否提供静态的数据源
//     hasDefaultValue: boolean;
//
//     // 必须是合法的JSON类型
//     data: DS;
//
//     // 默认值
//     defaultValue?: V;
//
//     bindType: BindType.VAR;
//
//     // 绑定的字段
//     bindKey: string;
// }
//
// // 绑定表达式数据源
// export interface IDatasourceBindExpressionConfig<V, DS> {
//
//     type: DatasourceType.BIND;
//
//     // 是否提供静态的数据源
//     useStaticDatasource: boolean;
//
//     // 是否提供静态的数据源
//     hasDefaultValue: boolean;
//
//     // 必须是合法的JSON类型
//     data: DS;
//
//     // 默认值
//     defaultValue?: V;
//
//     bindType: BindType.EXPRESSION;
//
//     // 绑定的表达式
//     bindJs: string;
// }
//
// export type IDatasourceBindConfig<V, DS> = IDatasourceBindVarConfig<V, DS> | IDatasourceBindExpressionConfig<V, DS>;
export interface IDatasourceConfig<V, DS> {

    // 数据源类型
    type: string;

    // 静态数据源
    data: DS;

    // 默认值
    defaultValue?: V;

    // 动态绑定函数
    func?: string;

    [key: string]: unknown;
}
