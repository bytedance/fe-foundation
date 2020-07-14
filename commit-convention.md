## Git Commit Message Convention

> This is adapted from [Angular's commit convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular).

### TL;DR:

提交信息必须满足以下正则表达式：

```js
/^(revert: )?(feat|fix|docs|style|refactor|perf|test|workflow|build|ci|chore|types|wip|dep)(\(.+\))?: .{1,50}/
```

### Changelog

后续会从 commit 信息自动生成 changelog ，**只有以下类型标签修改会被纳入到 changelog**：

1. `feat` ：新特性
2. `refactor` ：重构
3. `fix` ：问题修复
4. `style` ：样式改动
5. `types` ：类型定义相关
6. `dep` ：新增依赖或依赖版本变动
7. `docs` ：文档相关

#### 注意

- 如果一次修改涉及到多个类型，对比上述编号排序并选择编号最小的，或者选择最贴切的。
- 在切分支开发时需要注意，目前 merge request 通常没有启用 squash commits ，所以对于暂时不确定是否会被采用的修改，请使用 `chore` `wip` 等不会被纳入 changelog 的标签。
- 对于涉及到某个或多个 issue 的修改，请在提交信息中附带 `close #1234` 格式的标注。

## Examples

此次修改属于 Button 组件的新特性，新增了 primary 类型的按钮：

```
feat(Button): 新增 primary 类型按钮
```

此次修改属于全局样式的调整，修改了文字颜色，对应的 issue 编号为 567：

```
style(Global): 修改文字颜色 close #567
```
