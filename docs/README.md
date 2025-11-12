# 从 0 实现一门脚本语言（基于 JavaScript）

本教程带你用现代 JavaScript 实现一门小巧的解释型脚本语言，涵盖词法分析、语法解析、AST 设计、解释执行、作用域与闭包、数组与对象、内建函数、以及 CLI 运行器与示例。

- 项目根目录结构：
  - `src/lexer.js` 词法分析器
  - `src/parser.js` 递归下降解析器
  - `src/interpreter.js` 解释器与运行时
  - `run.js` CLI 入口
  - `examples/` 示例脚本
  - `docs/` 本教程

## 教程章节
- 00. 引言与快速开始（本语言能做什么） — 见 `00-intro.md`
- 01. 词法分析：将源码变成 Token 流 — 见 `01-lexer.md`
- 02. 语法解析：递归下降与 AST 构建 — 见 `02-parser.md`
- 03. 解释执行：环境、作用域与闭包 — 见 `03-interpreter.md`
- 04. 内建能力：数组、对象与内建函数 — 见 `04-builtins.md`
- 05. CLI 与示例：如何运行与调试 — 见 `05-cli-and-examples.md`
- 06. 进阶与扩展方向 — 见 `06-extensions.md`

阅读顺序建议：按编号依次阅读，边看边运行 `examples` 体会语言行为。

