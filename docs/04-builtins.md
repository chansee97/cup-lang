# 04. 内建能力：数组、对象与内建函数

核心位置：`src/interpreter.js:61` `installBuiltins()`

## 内建函数一览
- `print(...args)`：打印输出，返回 `null`
- `len(x)`：字符串/数组返回 `length`；对象返回键数；其他为 0
- `clock()`：当前时间秒（Unix 时间）
- `type(x)`：返回 `null`/`array`/`string`/`number`/`boolean`/`object`/`function` 等
- `keys(obj)`：对象的键数组，非对象返回空数组

示例：
```text
print('len([1,2]) =', len([1,2]));
print('type({}) =', type({}));
print('keys({a:1,b:2}) =', keys({a:1,b:2}));
```

## 属性与下标访问
- 属性：`obj.name`，对字符串/数组/对象均可访问其自带属性（如 `length`）。
- 下标：
  - 字符串/数组：使用整数索引访问单元素/字符
  - 对象：`obj[key]` 等价于属性访问（允许动态键）
- 访问空值：对 `null/undefined` 进行属性或下标访问会报错（防御性检查在 `getProperty`/`getIndex`）。

示例：
```text
let s = "hi"; let a = [10,20,30]; let o = { x: 1 };
print(s[1]);   // i
print(a[2]);   // 30
print(o['x']); // 1
```

## 真值与短路（复习）
- 假值：`false/null/0/""`；其余均为真值。
- 短路：`A || B` 若 `A` 为真直接返回 `A`；`A && B` 若 `A` 为假直接返回 `A`。

## 扩展建议
- 增加更多内建：`map/filter/reduce`、字符串方法等
- 提供标准库文件并通过 `import`/`include` 机制加载

