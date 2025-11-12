class Token {
  constructor(type, lexeme, literal, line, col) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
    this.col = col;
  }
}

const TokenType = {
  // Single-character tokens
  LEFT_PAREN: 'LEFT_PAREN', RIGHT_PAREN: 'RIGHT_PAREN',
  LEFT_BRACE: 'LEFT_BRACE', RIGHT_BRACE: 'RIGHT_BRACE',
  LEFT_BRACKET: 'LEFT_BRACKET', RIGHT_BRACKET: 'RIGHT_BRACKET',
  COMMA: 'COMMA', DOT: 'DOT', MINUS: 'MINUS', PLUS: 'PLUS',
  SEMICOLON: 'SEMICOLON', COLON: 'COLON', SLASH: 'SLASH', STAR: 'STAR', PERCENT: 'PERCENT',

  // One or two character tokens
  BANG: 'BANG', BANG_EQUAL: 'BANG_EQUAL',
  EQUAL: 'EQUAL', EQUAL_EQUAL: 'EQUAL_EQUAL',
  GREATER: 'GREATER', GREATER_EQUAL: 'GREATER_EQUAL',
  LESS: 'LESS', LESS_EQUAL: 'LESS_EQUAL',
  AND_AND: 'AND_AND', OR_OR: 'OR_OR',

  // Literals
  IDENTIFIER: 'IDENTIFIER', STRING: 'STRING', NUMBER: 'NUMBER',

  // Keywords
  LET: 'LET', FUN: 'FUN', IF: 'IF', ELSE: 'ELSE', WHILE: 'WHILE', RETURN: 'RETURN',
  TRUE: 'TRUE', FALSE: 'FALSE', NULL: 'NULL',

  EOF: 'EOF',
};

const keywords = {
  'let': TokenType.LET,
  'fun': TokenType.FUN,
  'if': TokenType.IF,
  'else': TokenType.ELSE,
  'while': TokenType.WHILE,
  'return': TokenType.RETURN,
  'true': TokenType.TRUE,
  'false': TokenType.FALSE,
  'null': TokenType.NULL,
};

class Lexer {
  constructor(source) {
    this.source = source;
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.col = 1;
  }

  scanTokens() {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }
    this.tokens.push(new Token(TokenType.EOF, '', null, this.line, this.col));
    return this.tokens;
  }

  isAtEnd() {
    return this.current >= this.source.length;
  }

  scanToken() {
    const c = this.advance();
    switch (c) {
      case '(': this.addToken(TokenType.LEFT_PAREN); break;
      case ')': this.addToken(TokenType.RIGHT_PAREN); break;
      case '{': this.addToken(TokenType.LEFT_BRACE); break;
      case '}': this.addToken(TokenType.RIGHT_BRACE); break;
      case '[': this.addToken(TokenType.LEFT_BRACKET); break;
      case ']': this.addToken(TokenType.RIGHT_BRACKET); break;
      case ',': this.addToken(TokenType.COMMA); break;
      case '.': this.addToken(TokenType.DOT); break;
      case '-': this.addToken(TokenType.MINUS); break;
      case '+': this.addToken(TokenType.PLUS); break;
      case ';': this.addToken(TokenType.SEMICOLON); break;
      case ':': this.addToken(TokenType.COLON); break;
      case '*': this.addToken(TokenType.STAR); break;
      case '%': this.addToken(TokenType.PERCENT); break;
      case '!': this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG); break;
      case '=': this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL); break;
      case '<': this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS); break;
      case '>': this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER); break;
      case '&':
        if (this.match('&')) this.addToken(TokenType.AND_AND); else this.error('Unexpected character: &');
        break;
      case '|':
        if (this.match('|')) this.addToken(TokenType.OR_OR); else this.error('Unexpected character: |');
        break;
      case '/':
        if (this.match('/')) {
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
        } else if (this.match('*')) {
          this.blockComment();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case ' ': case '\r': case '\t': break;
      case '\n': this.line++; this.col = 1; break;
      case '"': this.string('"'); break;
      case '\'': this.string('\''); break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          this.error(`Unexpected character: ${c}`);
        }
    }
  }

  advance() {
    const ch = this.source[this.current++];
    this.col++;
    return ch;
  }

  addToken(type, literal = null) {
    const text = this.source.slice(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line, this.col - (this.current - this.start)));
  }

  match(expected) {
    if (this.isAtEnd()) return false;
    if (this.source[this.current] !== expected) return false;
    this.current++;
    this.col++;
    return true;
  }

  peek() {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  peekNext() {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  string(quote) {
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === '\n') { this.line++; this.col = 1; }
      if (this.peek() === '\\') {
        // skip escape next char
        this.advance();
      }
      this.advance();
    }
    if (this.isAtEnd()) {
      this.error('Unterminated string');
      return;
    }
    this.advance();
    const value = this.source.slice(this.start + 1, this.current - 1)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
    this.addToken(TokenType.STRING, value);
  }

  number() {
    while (this.isDigit(this.peek())) this.advance();
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance();
      while (this.isDigit(this.peek())) this.advance();
    }
    const value = Number(this.source.slice(this.start, this.current));
    this.addToken(TokenType.NUMBER, value);
  }

  identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();
    const text = this.source.slice(this.start, this.current);
    const type = keywords[text] || TokenType.IDENTIFIER;
    this.addToken(type);
  }

  blockComment() {
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance(); this.advance();
        return;
      }
      if (this.peek() === '\n') { this.line++; this.col = 1; }
      this.advance();
    }
    this.error('Unterminated block comment');
  }

  isDigit(c) { return c >= '0' && c <= '9'; }
  isAlpha(c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$'; }
  isAlphaNumeric(c) { return this.isAlpha(c) || this.isDigit(c); }

  error(message) {
    throw new SyntaxError(`[Lexer] Line ${this.line}, Col ${this.col}: ${message}`);
  }
}

module.exports = { Lexer, TokenType, Token };

