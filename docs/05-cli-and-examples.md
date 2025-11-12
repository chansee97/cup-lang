# 05. CLI 与示例：如何运行与调试

核心文件：`run.js`（CLI 入口，读取文件后调用解释器执行）。

## CLI 用法
```bash
node run.js <script.lang>
```
- 若不传入脚本参数，会打印：`用法: node run.js <script.lang>`
- 路径建议：
  - Git Bash 使用正斜杠：`node run.js examples/fib.lang`
  - PowerShell/CMD 使用反斜杠：`node .\run.js .\examples\fib.lang`
  - 在 Git Bash 中用反斜杠可能被转义，导致路径错误。

入口代码（摘录自 `g:\project\ast\run.js:5`）：
```js
function main() {
  const file = process.argv[2];
  if (!file) { console.error('用法: node run.js <script.lang>'); process.exit(1); }
  const full = path.resolve(process.cwd(), file);
  const src = fs.readFileSync(full, 'utf8');
  execute(src);
}
```

## 示例脚本
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
- `examples/control.lang`
```text
let sum = 0; let i = 0;
while (i < 10) { sum = sum + i; i = i + 1; }
if (sum == 45) { print('sum ok =', sum); } else { print('sum error =', sum); }
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

## 常见问题
- 将 JS 文件当作本语言运行会在词法阶段报错，例如 `?`（三元）字符不被支持：
  - 现象：`[Lexer] Line X, Col Y: Unexpected character: ?`
  - 原因：执行了 `node run run.js`，把 `run.js` 作为脚本语言源码来解析
  - 修正：`node run.js examples/hello.lang`

