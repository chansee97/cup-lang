# 00. 引言与快速开始

本项目实现了一门小型、可读性强的解释型脚本语言，使用 JavaScript 编写。你将学习：
- 如何把源码切分为 Token（词法分析）
- 如何用递归下降方法把 Token 转换为 AST（语法解析）
- 如何遍历 AST 并执行（解释器）
- 如何支持变量、函数、作用域与闭包、数组与对象、内建函数等

## 语言特性概览
- 基本类型：number、string、true、false、null
- 变量声明：`let x = 1;`
- 表达式：`+ - * / %`，比较与逻辑：`== != < <= > >=`，`&& || !`
- 语句：`if (...) ... else ...`，`while (...) ...`，`return ...;`
- 复合类型：数组 `[...]`、对象 `{ key: value }`
- 访问：属性 `obj.name`，下标 `arr[i]`、`"abc"[0]`
- 内建：`print`、`len`、`clock`、`type`、`keys`

## 快速运行
- 运行 hello：
```bash
node run.js examples/hello.lang
```
- 运行 fib：
```bash
node run.js examples/fib.lang
```
Windows PowerShell 可使用：
```powershell
node .\run.js .\examples\fib.lang
```

## 示例：函数与循环
```text
fun fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
print('fib(10) =', fib(10));
```

接下来进入词法分析实现。

