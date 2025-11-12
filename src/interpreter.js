const { Lexer } = require('./lexer');
const { Parser } = require('./parser');

class RuntimeError extends Error {}

class Environment {
  constructor(enclosing = null) {
    this.values = new Map();
    this.enclosing = enclosing;
  }
  define(name, value) { this.values.set(name, value); }
  assign(name, value) {
    if (this.values.has(name)) { this.values.set(name, value); return; }
    if (this.enclosing) return this.enclosing.assign(name, value);
    throw new RuntimeError(`未定义的变量 '${name}'`);
  }
  get(name) {
    if (this.values.has(name)) return this.values.get(name);
    if (this.enclosing) return this.enclosing.get(name);
    throw new RuntimeError(`未定义的变量 '${name}'`);
  }
}

class ReturnSignal { constructor(value) { this.value = value; } }

class UserFunction {
  constructor(decl, closure) { this.decl = decl; this.closure = closure; }
  call(interpreter, args) {
    const env = new Environment(this.closure);
    for (let i = 0; i < this.decl.params.length; i++) {
      env.define(this.decl.params[i], args[i]);
    }
    try {
      interpreter.executeBlock(this.decl.body.body, env);
    } catch (ret) {
      if (ret instanceof ReturnSignal) return ret.value;
      throw ret;
    }
    return null;
  }
  arity() { return this.decl.params.length; }
  toString() { return `<fun ${this.decl.name}>`; }
}

function makeBuiltin(fn, name, arity = null) {
  return {
    name,
    call(_interpreter, args) { return fn(...args); },
    arity() { return arity ?? fn.length; },
    toString() { return `<builtin ${name}>`; }
  };
}

class Interpreter {
  constructor() {
    this.globals = new Environment();
    this.env = this.globals;
    this.installBuiltins();
  }

  installBuiltins() {
    this.globals.define('print', makeBuiltin((...args) => { console.log(...args); return null; }, 'print'));
    this.globals.define('len', makeBuiltin((x) => {
      if (x == null) return 0;
      if (typeof x === 'string' || Array.isArray(x)) return x.length;
      if (typeof x === 'object') return Object.keys(x).length;
      return 0;
    }, 'len', 1));
    this.globals.define('clock', makeBuiltin(() => Date.now() / 1000, 'clock', 0));
    this.globals.define('type', makeBuiltin((x) => {
      if (x === null) return 'null';
      if (Array.isArray(x)) return 'array';
      return typeof x;
    }, 'type', 1));
    this.globals.define('keys', makeBuiltin((obj) => {
      if (obj && typeof obj === 'object') return Object.keys(obj);
      return [];
    }, 'keys', 1));
  }

  run(source) {
    const lexer = new Lexer(source);
    const tokens = lexer.scanTokens();
    const parser = new Parser(tokens);
    const program = parser.parse();
    return this.evaluate(program);
  }

  evaluate(node) {
    switch (node.type) {
      case 'Program':
        for (const stmt of node.body) this.evaluate(stmt);
        return null;
      case 'Empty': return null;
      case 'VarDecl': {
        const value = node.initializer ? this.evaluate(node.initializer) : null;
        this.env.define(node.name, value); return null;
      }
      case 'FunctionDecl': {
        const func = new UserFunction(node, this.env);
        this.env.define(node.name, func); return null;
      }
      case 'Block': {
        this.executeBlock(node.body, new Environment(this.env));
        return null;
      }
      case 'If': {
        if (this.isTruthy(this.evaluate(node.condition))) {
          this.evaluate(node.then);
        } else if (node.else) {
          this.evaluate(node.else);
        }
        return null;
      }
      case 'While': {
        while (this.isTruthy(this.evaluate(node.condition))) {
          this.evaluate(node.body);
        }
        return null;
      }
      case 'Return': {
        const value = node.value ? this.evaluate(node.value) : null;
        throw new ReturnSignal(value);
      }
      case 'ExprStmt': this.evaluate(node.expression); return null;

      case 'Assign': {
        const value = this.evaluate(node.value);
        this.env.assign(node.name, value);
        return value;
      }

      case 'Logical': {
        const left = this.evaluate(node.left);
        if (node.operator === 'OR_OR') {
          if (this.isTruthy(left)) return left;
        } else {
          if (!this.isTruthy(left)) return left;
        }
        return this.evaluate(node.right);
      }

      case 'Binary': {
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);
        switch (node.operator) {
          case 'PLUS':
            if (typeof left === 'string' || typeof right === 'string') return String(left) + String(right);
            return Number(left) + Number(right);
          case 'MINUS': return Number(left) - Number(right);
          case 'STAR': return Number(left) * Number(right);
          case 'SLASH': return Number(left) / Number(right);
          case 'PERCENT': return Number(left) % Number(right);
          case 'GREATER': return left > right;
          case 'GREATER_EQUAL': return left >= right;
          case 'LESS': return left < right;
          case 'LESS_EQUAL': return left <= right;
          case 'EQUAL_EQUAL': return this.isEqual(left, right);
          case 'BANG_EQUAL': return !this.isEqual(left, right);
          default:
            throw new RuntimeError(`未知二元操作: ${node.operator}`);
        }
      }

      case 'Unary': {
        const right = this.evaluate(node.right);
        switch (node.operator) {
          case 'BANG': return !this.isTruthy(right);
          case 'MINUS': return -Number(right);
          default: throw new RuntimeError(`未知一元操作: ${node.operator}`);
        }
      }

      case 'Grouping': return this.evaluate(node.expression);
      case 'Literal': return node.value;
      case 'Variable': return this.env.get(node.name);
      case 'Array': return node.elements.map(e => this.evaluate(e));
      case 'Object': {
        const obj = {};
        for (const { key, value } of node.properties) obj[key] = this.evaluate(value);
        return obj;
      }
      case 'GetProp': {
        const obj = this.evaluate(node.object);
        return this.getProperty(obj, node.name);
      }
      case 'Index': {
        const obj = this.evaluate(node.object);
        const idx = this.evaluate(node.index);
        return this.getIndex(obj, idx);
      }
      case 'Call': {
        const callee = this.evaluate(node.callee);
        const args = node.args.map(a => this.evaluate(a));
        if (!callee || typeof callee.call !== 'function') {
          throw new RuntimeError('尝试调用一个不可调用的值');
        }
        if (typeof callee.arity === 'function') {
          const ar = callee.arity();
          if (ar != null && args.length !== ar) {
            // 不强制严格，但提示
          }
        }
        return callee.call(this, args);
      }
      default:
        throw new RuntimeError(`未知节点类型: ${node.type}`);
    }
  }

  executeBlock(statements, env) {
    const prev = this.env;
    try {
      this.env = env;
      for (const stmt of statements) this.evaluate(stmt);
    } finally {
      this.env = prev;
    }
  }

  isTruthy(value) {
    return !(value === false || value === null || value === 0 || value === '');
  }

  isEqual(a, b) {
    if (a === null && b === null) return true;
    if (a === null) return false;
    return a === b;
  }

  getProperty(obj, name) {
    if (obj == null) throw new RuntimeError('在null/undefined上访问属性');
    if (typeof obj === 'string' || Array.isArray(obj)) {
      if (name in obj) return obj[name];
    }
    if (typeof obj === 'object') {
      return obj[name];
    }
    return undefined;
  }

  getIndex(obj, idx) {
    if (obj == null) throw new RuntimeError('在null/undefined上使用下标');
    if (typeof obj === 'string') {
      const i = Number(idx);
      if (!Number.isInteger(i)) return undefined;
      return obj[i];
    }
    if (Array.isArray(obj)) {
      const i = Number(idx);
      if (!Number.isInteger(i)) return undefined;
      return obj[i];
    }
    if (typeof obj === 'object') {
      return obj[idx];
    }
    return undefined;
  }
}

function execute(source, providedGlobals = {}) {
  const interpreter = new Interpreter();
  for (const [k, v] of Object.entries(providedGlobals)) interpreter.globals.define(k, v);
  return interpreter.run(source);
}

module.exports = { Interpreter, Environment, execute, RuntimeError };

