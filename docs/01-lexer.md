# 01. 词法分析：把源码切成 Token

目标：把源代码字符串扫描为 Token 序列，为语法解析提供输入。

核心文件与位置：
- 记号类型定义：`src/lexer.js:11`
- 关键字表：`src/lexer.js:36`
- 扫描入口：`src/lexer.js:58` `scanTokens()`

## Token 设计
```js
class Token {
  constructor(type, lexeme, literal, line, col) { /* 见 src/lexer.js:1 */ }
}
```
- `type`：枚举型字符串，如 `IDENTIFIER`、`NUMBER`、`PLUS` 等
- `lexeme`：源码片段原文
- `literal`：字面量值（数字、字符串等），非字面量则为 `null`
- `line/col`：位置信息，便于错误提示

## 支持的 Token
- 单字符：`(){}[] , . - + ; : / * %`
- 复合运算符：`! !=`、`= ==`、`< <=`、`> >=`、`&&`、`||`
- 字面量与标识符：`NUMBER`、`STRING`、`IDENTIFIER`
- 关键字：`let fun if else while return true false null`

## 扫描流程
- 外层循环逐字符读取（`scanTokens`），对不同首字符分派处理（`scanToken`）。
- 注释：`//` 行注释直至换行；`/* ... */` 支持嵌套块内换行。
- 字符串：支持 `"..."` 与 `'...'`，常用转义：`\n`、`\t`、`\"`、`\'`。
- 数字：整数与小数（`123`、`3.14`）。
- 标识符/关键字：`[a-zA-Z_$][a-zA-Z0-9_$]*`，关键字通过表映射为专用类型。

示例：
```text
let x = 3.14; // NUMBER:3.14  SEMICOLON
```
对应 Token 序列（概念上）：
```
LET IDENTIFIER(x) EQUAL NUMBER(3.14) SEMICOLON
```

## 错误处理
- 对无法识别的字符抛出语法错误：`[Lexer] Line X, Col Y: Unexpected character: ...`
- 常见触发：把 JS 文件当本语言运行时，如 `?`、`:` 等 JS 特有符号出现在不被支持的位置。

## 代码片段
```js
// 扫描主循环（src/lexer.js:58）
scanTokens() {
  while (!this.isAtEnd()) {
    this.start = this.current;
    this.scanToken();
  }
  this.tokens.push(new Token(TokenType.EOF, '', null, this.line, this.col));
  return this.tokens;
}
```

继续阅读语法解析章节，看看这些 Token 如何被组织为 AST。

