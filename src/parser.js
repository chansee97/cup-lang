const { TokenType } = require('./lexer');

class ParseError extends SyntaxError {}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }
    return { type: 'Program', body: statements };
  }

  declaration() {
    try {
      if (this.match(TokenType.FUN)) return this.function('function');
      if (this.match(TokenType.LET)) return this.varDeclaration();
      return this.statement();
    } catch (e) {
      if (!(e instanceof ParseError)) throw e;
      this.synchronize();
      return { type: 'Empty' };
    }
  }

  function(kind) {
    const name = this.consume(TokenType.IDENTIFIER, `期待${kind}名称`);
    this.consume(TokenType.LEFT_PAREN, "期待'('在参数列表前");
    const params = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        const param = this.consume(TokenType.IDENTIFIER, '期待参数名');
        params.push(param.lexeme);
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, "期待')'在参数列表后");
    const body = this.block();
    return { type: 'FunctionDecl', name: name.lexeme, params, body };
  }

  varDeclaration() {
    const name = this.consume(TokenType.IDENTIFIER, '变量声明需要名称');
    let initializer = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }
    this.consume(TokenType.SEMICOLON, '变量声明后需要分号');
    return { type: 'VarDecl', name: name.lexeme, initializer };
  }

  statement() {
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.LEFT_BRACE)) return this.block(true);
    return this.expressionStatement();
  }

  ifStatement() {
    this.consume(TokenType.LEFT_PAREN, "期待'('在if条件前");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "期待')'在if条件后");
    const thenBranch = this.statement();
    let elseBranch = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }
    return { type: 'If', condition, then: thenBranch, else: elseBranch };
  }

  whileStatement() {
    this.consume(TokenType.LEFT_PAREN, "期待'('在while条件前");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "期待')'在while条件后");
    const body = this.statement();
    return { type: 'While', condition, body };
  }

  returnStatement() {
    let value = null;
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }
    this.consume(TokenType.SEMICOLON, 'return语句后需要分号');
    return { type: 'Return', value };
  }

  block(alreadyOpened = false) {
    const statements = [];
    if (!alreadyOpened) this.consume(TokenType.LEFT_BRACE, "期待'{'开始代码块");
    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }
    this.consume(TokenType.RIGHT_BRACE, "期待'}'结束代码块");
    return { type: 'Block', body: statements };
  }

  expressionStatement() {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, '表达式语句后需要分号');
    return { type: 'ExprStmt', expression: expr };
  }

  expression() { return this.assignment(); }

  assignment() {
    const expr = this.or();
    if (this.match(TokenType.EQUAL)) {
      const value = this.assignment();
      if (expr.type === 'Variable') {
        return { type: 'Assign', name: expr.name, value };
      }
      this.error(this.previous(), '无效的赋值目标');
    }
    return expr;
  }

  or() {
    let expr = this.and();
    while (this.match(TokenType.OR_OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = { type: 'Logical', operator: operator.type, left: expr, right };
    }
    return expr;
  }

  and() {
    let expr = this.equality();
    while (this.match(TokenType.AND_AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = { type: 'Logical', operator: operator.type, left: expr, right };
    }
    return expr;
  }

  equality() {
    let expr = this.comparison();
    while (this.match(TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = { type: 'Binary', operator: operator.type, left: expr, right };
    }
    return expr;
  }

  comparison() {
    let expr = this.term();
    while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.term();
      expr = { type: 'Binary', operator: operator.type, left: expr, right };
    }
    return expr;
  }

  term() {
    let expr = this.factor();
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = { type: 'Binary', operator: operator.type, left: expr, right };
    }
    return expr;
  }

  factor() {
    let expr = this.unary();
    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const operator = this.previous();
      const right = this.unary();
      expr = { type: 'Binary', operator: operator.type, left: expr, right };
    }
    return expr;
  }

  unary() {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return { type: 'Unary', operator: operator.type, right };
    }
    return this.call();
  }

  call() {
    let expr = this.primary();
    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.DOT)) {
        const name = this.consume(TokenType.IDENTIFIER, '期待属性名');
        expr = { type: 'GetProp', object: expr, name: name.lexeme };
      } else if (this.match(TokenType.LEFT_BRACKET)) {
        const index = this.expression();
        this.consume(TokenType.RIGHT_BRACKET, "期待']'在下标访问后");
        expr = { type: 'Index', object: expr, index };
      } else {
        break;
      }
    }
    return expr;
  }

  finishCall(callee) {
    const args = [];
    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RIGHT_PAREN, "期待')'在参数列表后");
    return { type: 'Call', callee, args };
  }

  primary() {
    if (this.match(TokenType.FALSE)) return { type: 'Literal', value: false };
    if (this.match(TokenType.TRUE)) return { type: 'Literal', value: true };
    if (this.match(TokenType.NULL)) return { type: 'Literal', value: null };

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return { type: 'Literal', value: this.previous().literal };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return { type: 'Variable', name: this.previous().lexeme };
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "期待')'在分组表达式后");
      return { type: 'Grouping', expression: expr };
    }

    if (this.match(TokenType.LEFT_BRACKET)) {
      const elements = [];
      if (!this.check(TokenType.RIGHT_BRACKET)) {
        do {
          elements.push(this.expression());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RIGHT_BRACKET, "期待']'结束数组");
      return { type: 'Array', elements };
    }

    if (this.match(TokenType.LEFT_BRACE)) {
      const properties = [];
      if (!this.check(TokenType.RIGHT_BRACE)) {
        do {
          let keyToken;
          if (this.match(TokenType.IDENTIFIER)) {
            keyToken = this.previous();
          } else if (this.match(TokenType.STRING)) {
            keyToken = this.previous();
          } else {
            this.error(this.peek(), '对象字面量的键需要标识符或字符串');
          }
          this.consume(TokenType.COLON, "期待':'在键和值之间");
          const value = this.expression();
          properties.push({ key: keyToken.literal ?? keyToken.lexeme, value });
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RIGHT_BRACE, "期待'}'结束对象");
      return { type: 'Object', properties };
    }

    this.error(this.peek(), '无法解析的表达式');
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) { this.advance(); return true; }
    }
    return false;
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();
    this.error(this.peek(), message);
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  isAtEnd() { return this.peek().type === TokenType.EOF; }
  peek() { return this.tokens[this.current]; }
  previous() { return this.tokens[this.current - 1]; }

  error(token, message) {
    const where = token && token.type !== TokenType.EOF ? `在'${token.lexeme}'附近` : '在文件末尾';
    throw new ParseError(`[Parser] ${where}: ${message}`);
  }

  synchronize() {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;
      switch (this.peek().type) {
        case TokenType.FUN:
        case TokenType.LET:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.RETURN:
          return;
      }
      this.advance();
    }
  }
}

module.exports = { Parser, ParseError };

