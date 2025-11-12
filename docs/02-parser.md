# 02. 语法解析：递归下降与 AST 构建

目标：把 Token 流转换成 AST（抽象语法树）。

核心文件与位置：
- 解析入口：`src/parser.js:11` `parse()`
- 声明分派：`src/parser.js:19` `declaration()`
- 函数声明：`src/parser.js:31` `function()`
- 变量声明：`src/parser.js:46` `varDeclaration()`
- 语句：`src/parser.js:56` `statement()`
- 表达式优先级链：`src/parser.js:109` 起（assignment → or → and → equality → comparison → term → factor → unary → call → primary）

## AST 概览
- 程序：`{ type: 'Program', body: [stmt...] }`
- 语句：`VarDecl`、`FunctionDecl`、`Block`、`If`、`While`、`Return`、`ExprStmt`
- 表达式：`Assign`、`Logical`、`Binary`、`Unary`、`Grouping`、`Literal`、`Variable`、`Call`、`GetProp`、`Index`、`Array`、`Object`

## 声明与语句
- 变量声明：
```text
let x = 123;
```
对应 AST：
```json
{ "type": "VarDecl", "name": "x", "initializer": { "type": "Literal", "value": 123 } }
```
- 函数声明：
```text
fun add(a, b) { return a + b; }
```
对应 AST（简化）：
```json
{ "type": "FunctionDecl", "name": "add", "params": ["a","b"], "body": {"type":"Block", "body":[...]} }
```

## 表达式优先级与结合性
- 赋值 `=`（右结合）：`a = b = 1`
- 逻辑 `||`、`&&`：短路
- 比较、加减、乘除模：常规优先级
- 一元 `!`、`-`：最高于二元
- 调用/属性/下标：可级联，如 `a.b(c)[0].d`

示例（取自源码）：
```js
// 赋值（src/parser.js:111）
assignment() {
  const expr = this.or();
  if (this.match(TokenType.EQUAL)) {
    const value = this.assignment();
    if (expr.type === 'Variable') { return { type: 'Assign', name: expr.name, value }; }
    this.error(this.previous(), '无效的赋值目标');
  }
  return expr;
}
```

## 数组与对象字面量
- 数组：`[expr, expr, ...]` → `Array { elements: [...] }`
- 对象：`{ key: value, ... }`，键支持标识符或字符串常量 → `Object { properties: [{key, value}] }`
参考：`src/parser.js:241` 与 `src/parser.js:252`

## 调用、属性与下标
```text
fn(1, 2).name  arr[i]
```
- 解析顺序：从 `primary()` 开始，循环吞噬 `()`、`.`、`[]`（`src/parser.js:192`）。

## 错误恢复
- 使用 `synchronize()` 跳过到下一个可能的语句起点（如遇到 `;`、`fun`、`let` 等），减少瀑布错误。

继续阅读解释器章节，了解如何“执行”这些 AST。

