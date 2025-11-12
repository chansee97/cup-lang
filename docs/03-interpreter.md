# 03. 解释执行：环境、作用域与闭包

目标：遍历 AST 并执行，支持变量、函数、块级作用域、闭包、控制流、运算与数据结构访问。

核心文件与位置：
- 入口执行：`src/interpreter.js:81` `run(source)`
- 全局与词法环境：`src/interpreter.js:6` `Environment`，以及 `src/interpreter.js:54` 构造器中初始化
- 语句分派执行：`src/interpreter.js:89` `evaluate(node)`
- 执行代码块：`src/interpreter.js:211` `executeBlock(statements, env)`
- 函数对象与返回：`src/interpreter.js:24` `ReturnSignal`，`src/interpreter.js:26` `UserFunction`

## 环境模型（词法作用域）
```js
class Environment {
  constructor(enclosing = null) { this.values = new Map(); this.enclosing = enclosing; }
  define(name, value) { this.values.set(name, value); }
  assign(name, value) { /* 向上查找并赋值，未定义时报错（src/interpreter.js:12） */ }
  get(name) { /* 向上查找并取值，未定义时报错（src/interpreter.js:17） */ }
}
```
- 进入块或函数体时创建新环境，链到外层（闭包）。
- 变量查找顺着链向上，直到全局。

## 语句执行
- 变量/函数声明：把值或函数对象绑定到当前环境。
- 块：创建新环境执行其 body（`executeBlock`）。
- `if/while`：按照条件分支与循环执行。
- `return`：通过抛出 `ReturnSignal` 实现非局部跳转，从函数体返回。

示例（块执行）：
```js
// src/interpreter.js:211
executeBlock(statements, env) {
  const prev = this.env;
  try { this.env = env; for (const stmt of statements) this.evaluate(stmt); }
  finally { this.env = prev; }
}
```

## 表达式求值
- `Assign`：对已有变量赋值。
- `Logical`：`||` 和 `&&` 短路。
- `Binary`：算术/比较/相等。
- `Unary`：逻辑非与取负。
- `Grouping`、`Literal`、`Variable`：常规。
- `Array`、`Object`：构造数组与对象。
- `GetProp`、`Index`：属性与下标读取（字符串/数组/对象）。
- `Call`：可调用对象需要具备 `call(interpret,args)` 与可选 `arity()`。

示例（短路逻辑）：
```js
// 概念片段
a() || b() // 若 a() 真值，则 b() 不会被调用
x && y     // 若 x 假值，则 y 不会被计算
```

## 函数与闭包
```text
let x = 10;
fun f(y) { return x + y; }
print(f(5)); // 15：f 捕获了定义时外层环境中的 x
```
实现要点：
- 定义函数时捕获当前 `env` 作为 `closure`（`UserFunction`）。
- 调用时以 `closure` 为外层，创建调用帧环境并绑定参数。

## 真值与相等性
- 真值判断：`false/null/0/""` 视为假，其他为真（`src/interpreter.js:221`）。
- 相等：`null` 与 `null` 为真；否则使用 `===`（`src/interpreter.js:225`）。

继续阅读下一章了解内建与对象/数组行为细节。

