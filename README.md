# 迷你脚本语言：语法总览与速查

本项目实现了一门用 JavaScript 编写的迷你解释型脚本语言，覆盖变量、函数、分支、循环、数组与对象、属性/下标访问、算术与逻辑、返回语句与若干内建函数。本文档列出该语言当前全部语法能力与注意事项。

- 入口与运行：`node run.js <script.lang>`（Git Bash 用正斜杠路径，PowerShell/CMD 可用反斜杠）
- 参考源码位置：
  - 词法：`src/lexer.js:11`、`src/lexer.js:36`、`src/lexer.js:58`
  - 解析：`src/parser.js:11`、`src/parser.js:19`、`src/parser.js:109`、`src/parser.js:192`
  - 执行：`src/interpreter.js:61`、`src/interpreter.js:81`、`src/interpreter.js:89`、`src/interpreter.js:211`

## 基本元素
- 注释：
  - 行注释：`// comment`
  - 块注释：`/* comment */`
- 字面量：
  - 数字：`123`、`3.14`
  - 字符串：`"hello"`、`'world'`，支持转义：`\n`、`\t`、`\"`、`\'`
  - 布尔：`true`、`false`
  - 空：`null`
- 分组：
  - 括号：`( expression )`

## 变量与作用域
- 变量声明（分号必需）：
```text
let x;
let y = 42;
```
- 赋值（右结合）：
```text
x = 1;
a = b = 3;
```
- 词法作用域与块级作用域：在 `{ ... }` 内声明的变量只在块内可见。

## 表达式与运算符
- 算术：`+ - * / %`
- 比较：`< <= > >=`
- 相等：`== !=`
- 逻辑：`&& ||`（短路），一元：`!`、`-`
- 属性访问：`obj.name`
- 下标访问：`arr[i]`、`obj[expr]`、`"hi"[0]`
- 函数调用：`callee(arg1, arg2)`（可级联：`a.b(c)[0].d(e)`）

优先级（高→低）：
1) 调用/属性/下标  2) 一元 `! -`  3) 乘除模 `* / %`  4) 加减 `+ -`  5) 比较  6) 相等  7) 逻辑与 `&&`  8) 逻辑或 `||`  9) 赋值 `=`（右结合）

## 语句
- 表达式语句（分号必需）：
```text
print("hi");
x = x + 1;
```
- 变量声明：见上（分号必需）。
- 代码块：
```text
{
  let t = 1;
  print(t);
}
```
- 条件分支：
```text
if (cond) statement
else statement
```
- 循环：
```text
while (cond) statement
```
- 返回语句（函数内部）：
```text
return;        // 返回 null
return expr;   // 返回 expr 的值
```

注意：
- 以分号结尾的包括“变量声明、表达式语句、return 语句”；函数声明与块语句不以分号结尾。

## 函数
- 声明：
```text
fun add(a, b) {
  return a + b;
}
```
- 参数：以逗号分隔，调用时按位置传参。
- 返回：使用 `return`。未显式返回时，函数调用结果为 `null`。
- 闭包：函数捕获其定义时的外层环境。

## 复合类型
- 数组字面量：
```text
let a = [1, 2, 3];
let x = a[0];
```
- 对象字面量（键可为标识符或字符串）：
```text
let o = { name: "Alice", "age": 30 };
print(o.name);
print(o["age"]);
```

## 真值规则与短路
- 假值：`false`、`null`、`0`、`""`；其余为真值。
- 短路：
  - `A || B` 若 `A` 为真，返回 `A`，否则返回 `B` 的结果。
  - `A && B` 若 `A` 为假，返回 `A`，否则返回 `B` 的结果。

## 内建函数（标准库）
- `print(...args)`：打印，返回 `null`。
- `len(x)`：字符串/数组返回长度；对象返回键数；其他返回 0。
- `clock()`：Unix 时间秒。
- `type(x)`：返回 `null`/`array`/`string`/`number`/`boolean`/`object`/`function` 等类型名。
- `keys(obj)`：对象键数组（非对象返回空数组）。

对应实现：`src/interpreter.js:61`。

## 不支持/限制（当前版本）
- 不支持三元运算符 `?:`、`for`、`break/continue`、解构、可选链等。
- 赋值仅支持变量目标（不支持 `obj.key = ...` 或 `arr[i] = ...`）。
- 分号是必需的（除块/函数声明外）。

## 示例
- `examples/hello.lang`
```text
print("Hello, 世界");
```
- `examples/fib.lang`
```text
fun fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
print('fib(10) =', fib(10));
```
- `examples/objects.lang`
```text
let nums = [1, 2, 3, 4];
let person = { name: 'Alice', age: 30 };
print('len(nums) =', len(nums));
print('person.name =', person.name, 'age =', person.age);
print('nums[2] =', nums[2]);
print('"hi"[1] =', "hi"[1]);
print('keys(person) =', keys(person));
```

## 运行
- Git Bash：`node run.js examples/fib.lang`
- PowerShell/CMD：`node .\run.js .\examples\fib.lang`

如需扩展语法或标准库，可参考：`docs/06-extensions.md`。
