/**
 * Reverse-Engineered CalcManager & ViewModel Engine
 * Based on Microsoft.WindowsCalculator (CalcViewModel.dll / CalculatorApp.ViewModel.winmd)
 * Reverse engineered with Reverse Engineer Anything (REA)
 */

export const Mode = {
  STANDARD: 'Standard',
  SCIENTIFIC: 'Scientific'
};

export const Operator = {
  ADD: 'Add',
  SUBTRACT: 'Subtract',
  MULTIPLY: 'Multiply',
  DIVIDE: 'Divide',
  POWER_Y: 'PowerY',
  ROOT_X: 'RootX',
  LOG_BASE_Y: 'LogBaseY',
  EQUALS: 'Equals'
};

export const UnaryOperator = {
  PERCENT: 'Percent',
  RECIPROCAL: 'Invert',     // 1/x
  SQUARE: 'Power2',          // x^2
  SQRT: 'Sqrt',              // √x
  CUBE: 'Cube',              // x^3
  CUBE_ROOT: 'CubeRoot',     // ∛x
  NEGATE: 'Negate',          // +/-
  FACTORIAL: 'Factorial',    // n!
  LOG10: 'LogBase10',        // log
  LN: 'LogBaseE',            // ln
  EXP: 'Exp',                // e^x
  POW10: 'PowerX',           // 10^x
  POW2: 'TwoPowerX',         // 2^x
  SIN: 'Sin',
  COS: 'Cos',
  TAN: 'Tan',
  SINH: 'Sinh',
  COSH: 'Cosh',
  TANH: 'Tanh'
};

export class CalcEngine {
  constructor(mode = Mode.STANDARD) {
    this.mode = mode;
    this.currentInput = '0';
    this.storedValue = null;
    this.pendingOperator = null;
    this.expressionTokens = [];
    this.isWaitingForOperand = false;
    this.hasJustCalculated = false;
    this.isError = false;
    this.errorMessage = '';
    this.memoryItems = []; // Array of numbers
    this.historyItems = []; // Array of { expression, result }
    this.scientificTokens = []; // Tokens for algebraic evaluation
    this.angleMode = 'DEG'; // 'DEG' or 'RAD'
  }

  setMode(mode) {
    if (this.mode !== mode) {
      this.mode = mode;
      this.clear();
    }
  }

  // --- Input Methods ---
  inputDigit(digit) {
    if (this.isError) this.clear();

    if (this.hasJustCalculated) {
      this.currentInput = digit.toString();
      this.expressionTokens = [];
      this.scientificTokens = [];
      this.hasJustCalculated = false;
      this.isWaitingForOperand = false;
      return;
    }

    if (this.isWaitingForOperand) {
      this.currentInput = digit.toString();
      this.isWaitingForOperand = false;
      return;
    }

    if (this.currentInput === '0' || this.currentInput === '-0') {
      this.currentInput = (this.currentInput === '-0' ? '-' : '') + digit.toString();
    } else {
      if (this.currentInput.replace(/[-,.]/g, '').length < 16) {
        this.currentInput += digit.toString();
      }
    }
  }

  inputDecimal() {
    if (this.isError) this.clear();

    if (this.hasJustCalculated) {
      this.currentInput = '0.';
      this.expressionTokens = [];
      this.scientificTokens = [];
      this.hasJustCalculated = false;
      this.isWaitingForOperand = false;
      return;
    }

    if (this.isWaitingForOperand) {
      this.currentInput = '0.';
      this.isWaitingForOperand = false;
      return;
    }

    if (!this.currentInput.includes('.')) {
      this.currentInput += '.';
    }
  }

  backspace() {
    if (this.isError || this.hasJustCalculated || this.isWaitingForOperand) {
      this.currentInput = '0';
      return;
    }

    if (this.currentInput.length > 1) {
      this.currentInput = this.currentInput.slice(0, -1);
      if (this.currentInput === '-' || this.currentInput === '') {
        this.currentInput = '0';
      }
    } else {
      this.currentInput = '0';
    }
  }

  clearEntry() {
    this.currentInput = '0';
    this.isError = false;
    this.errorMessage = '';
  }

  clear() {
    this.currentInput = '0';
    this.storedValue = null;
    this.pendingOperator = null;
    this.expressionTokens = [];
    this.scientificTokens = [];
    this.isWaitingForOperand = false;
    this.hasJustCalculated = false;
    this.isError = false;
    this.errorMessage = '';
  }

  // --- Binary Operations ---
  applyOperator(operator) {
    if (this.isError) return;

    const currentNum = parseFloat(this.currentInput);

    if (this.mode === Mode.STANDARD) {
      if (this.pendingOperator && !this.isWaitingForOperand && !this.hasJustCalculated) {
        const result = this._computeBinary(this.storedValue, currentNum, this.pendingOperator);
        if (result === null) return;
        this.storedValue = result;
        this.currentInput = this._formatResult(result);
      } else {
        this.storedValue = currentNum;
      }

      this.pendingOperator = operator;
      const opSymbol = this._getOperatorSymbol(operator);
      this.expressionTokens = [`${this._formatDisplay(this.storedValue)} ${opSymbol}`];
      this.isWaitingForOperand = true;
      this.hasJustCalculated = false;
    } else {
      // Scientific Mode (BODMAS / Operator Precedence)
      const opSymbol = this._getOperatorSymbol(operator);
      if (this.hasJustCalculated) {
        this.scientificTokens = [{ type: 'number', value: currentNum }, { type: 'op', value: operator, symbol: opSymbol }];
        this.hasJustCalculated = false;
      } else if (this.isWaitingForOperand && this.scientificTokens.length > 0) {
        // Replace previous pending operator if typed consecutively
        this.scientificTokens[this.scientificTokens.length - 1] = { type: 'op', value: operator, symbol: opSymbol };
      } else {
        this.scientificTokens.push({ type: 'number', value: currentNum });
        this.scientificTokens.push({ type: 'op', value: operator, symbol: opSymbol });
      }
      this.expressionTokens = [this.scientificTokens.map(t => t.symbol || this._formatDisplay(t.value)).join(' ')];
      this.isWaitingForOperand = true;
    }
  }

  calculate() {
    if (this.isError) return;

    const currentNum = parseFloat(this.currentInput);

    if (this.mode === Mode.STANDARD) {
      if (this.pendingOperator && this.storedValue !== null) {
        const opSymbol = this._getOperatorSymbol(this.pendingOperator);
        const fullExpr = `${this._formatDisplay(this.storedValue)} ${opSymbol} ${this._formatDisplay(currentNum)} =`;
        const result = this._computeBinary(this.storedValue, currentNum, this.pendingOperator);
        if (result === null) return;

        this._addHistory(fullExpr, this._formatResult(result));
        this.currentInput = this._formatResult(result);
        this.storedValue = null;
        this.pendingOperator = null;
        this.expressionTokens = [fullExpr];
        this.hasJustCalculated = true;
        this.isWaitingForOperand = false;
      }
    } else {
      // Scientific Mode evaluation
      if (this.scientificTokens.length > 0) {
        if (!this.isWaitingForOperand) {
          this.scientificTokens.push({ type: 'number', value: currentNum });
        }
        const fullExpr = this.scientificTokens.map(t => t.symbol || this._formatDisplay(t.value)).join(' ') + ' =';
        const result = this._evaluateScientificExpression(this.scientificTokens);
        if (result === null) return;

        this._addHistory(fullExpr, this._formatResult(result));
        this.currentInput = this._formatResult(result);
        this.scientificTokens = [];
        this.expressionTokens = [fullExpr];
        this.hasJustCalculated = true;
        this.isWaitingForOperand = false;
      }
    }
  }

  // --- Unary Operations ---
  applyUnary(unaryOp) {
    if (this.isError) return;

    let num = parseFloat(this.currentInput);
    let result = 0;
    let tokenStr = '';

    switch (unaryOp) {
      case UnaryOperator.PERCENT:
        if (this.mode === Mode.STANDARD && this.storedValue !== null) {
          result = (this.storedValue * num) / 100;
        } else {
          result = num / 100;
        }
        tokenStr = `${this._formatDisplay(result)}`;
        break;

      case UnaryOperator.RECIPROCAL:
        if (num === 0) {
          this._setError('Cannot divide by zero');
          return;
        }
        result = 1 / num;
        tokenStr = `1/(${this._formatDisplay(num)})`;
        break;

      case UnaryOperator.SQUARE:
        result = Math.pow(num, 2);
        tokenStr = `sqr(${this._formatDisplay(num)})`;
        break;

      case UnaryOperator.SQRT:
        if (num < 0) {
          this._setError('Invalid input');
          return;
        }
        result = Math.sqrt(num);
        tokenStr = `√(${this._formatDisplay(num)})`;
        break;

      case UnaryOperator.CUBE:
        result = Math.pow(num, 3);
        tokenStr = `cube(${this._formatDisplay(num)})`;
        break;

      case UnaryOperator.CUBE_ROOT:
        result = Math.cbrt(num);
        tokenStr = `cbrt(${this._formatDisplay(num)})`;
        break;

      case UnaryOperator.NEGATE:
        result = -num;
        this.currentInput = this._formatResult(result);
        return;

      case UnaryOperator.FACTORIAL:
        if (num < 0 || !Number.isInteger(num) || num > 170) {
          this._setError('Invalid input');
          return;
        }
        result = this._factorial(num);
        tokenStr = `fact(${num})`;
        break;

      case UnaryOperator.LOG10:
        if (num <= 0) {
          this._setError('Invalid input');
          return;
        }
        result = Math.log10(num);
        tokenStr = `log(${this._formatDisplay(num)})`;
        break;

      case UnaryOperator.LN:
        if (num <= 0) {
          this._setError('Invalid input');
          return;
        }
        result = Math.log(num);
        tokenStr = `ln(${this._formatDisplay(num)})`;
        break;

      case UnaryOperator.EXP:
        result = Math.exp(num);
        tokenStr = `e^(${this._formatDisplay(num)})`;
        break;

      case UnaryOperator.POW10:
        result = Math.pow(10, num);
        tokenStr = `10^(${this._formatDisplay(num)})`;
        break;

      case UnaryOperator.POW2:
        result = Math.pow(2, num);
        tokenStr = `2^(${this._formatDisplay(num)})`;
        break;

      case UnaryOperator.SIN: {
        const rad = this.angleMode === 'DEG' ? (num * Math.PI) / 180 : num;
        result = Math.sin(rad);
        tokenStr = `sin(${this._formatDisplay(num)})`;
        break;
      }
      case UnaryOperator.COS: {
        const rad = this.angleMode === 'DEG' ? (num * Math.PI) / 180 : num;
        result = Math.cos(rad);
        tokenStr = `cos(${this._formatDisplay(num)})`;
        break;
      }
      case UnaryOperator.TAN: {
        const rad = this.angleMode === 'DEG' ? (num * Math.PI) / 180 : num;
        result = Math.tan(rad);
        tokenStr = `tan(${this._formatDisplay(num)})`;
        break;
      }
      case UnaryOperator.SINH:
        result = Math.sinh(num);
        tokenStr = `sinh(${this._formatDisplay(num)})`;
        break;
      case UnaryOperator.COSH:
        result = Math.cosh(num);
        tokenStr = `cosh(${this._formatDisplay(num)})`;
        break;
      case UnaryOperator.TANH:
        result = Math.tanh(num);
        tokenStr = `tanh(${this._formatDisplay(num)})`;
        break;

      default:
        return;
    }

    this.currentInput = this._formatResult(result);
    if (this.expressionTokens.length > 0 && !this.hasJustCalculated) {
      this.expressionTokens = [...this.expressionTokens, tokenStr];
    } else {
      this.expressionTokens = [tokenStr];
    }
    this.isWaitingForOperand = true;
  }

  // --- Memory Operations ---
  memoryClear() {
    this.memoryItems = [];
  }

  memoryRecall() {
    if (this.memoryItems.length > 0) {
      this.currentInput = this._formatResult(this.memoryItems[0]);
      this.isWaitingForOperand = true;
    }
  }

  memoryStore() {
    const val = parseFloat(this.currentInput);
    if (!isNaN(val)) {
      this.memoryItems.unshift(val);
      this.isWaitingForOperand = true;
    }
  }

  memoryAdd() {
    const val = parseFloat(this.currentInput);
    if (isNaN(val)) return;

    if (this.memoryItems.length === 0) {
      this.memoryItems.unshift(val);
    } else {
      this.memoryItems[0] = this._round(this.memoryItems[0] + val);
    }
    this.isWaitingForOperand = true;
  }

  memorySubtract() {
    const val = parseFloat(this.currentInput);
    if (isNaN(val)) return;

    if (this.memoryItems.length === 0) {
      this.memoryItems.unshift(-val);
    } else {
      this.memoryItems[0] = this._round(this.memoryItems[0] - val);
    }
    this.isWaitingForOperand = true;
  }

  clearHistory() {
    this.historyItems = [];
  }

  // --- Internal Helpers ---
  _computeBinary(a, b, op) {
    let result = 0;
    switch (op) {
      case Operator.ADD:
        result = a + b;
        break;
      case Operator.SUBTRACT:
        result = a - b;
        break;
      case Operator.MULTIPLY:
        result = a * b;
        break;
      case Operator.DIVIDE:
        if (b === 0) {
          this._setError('Cannot divide by zero');
          return null;
        }
        result = a / b;
        break;
      case Operator.POWER_Y:
        result = Math.pow(a, b);
        break;
      case Operator.ROOT_X:
        if (b === 0) {
          this._setError('Invalid input');
          return null;
        }
        result = Math.pow(a, 1 / b);
        break;
      case Operator.LOG_BASE_Y:
        if (a <= 0 || b <= 0 || b === 1) {
          this._setError('Invalid input');
          return null;
        }
        result = Math.log(a) / Math.log(b);
        break;
      default:
        return b;
    }
    return this._round(result);
  }

  _evaluateScientificExpression(tokens) {
    try {
      const precedence = {
        [Operator.POWER_Y]: 3,
        [Operator.ROOT_X]: 3,
        [Operator.MULTIPLY]: 2,
        [Operator.DIVIDE]: 2,
        [Operator.ADD]: 1,
        [Operator.SUBTRACT]: 1
      };

      const outputQueue = [];
      const opStack = [];

      for (const token of tokens) {
        if (token.type === 'number') {
          outputQueue.push(token.value);
        } else if (token.type === 'op') {
          while (
            opStack.length > 0 &&
            precedence[opStack[opStack.length - 1]] >= precedence[token.value]
          ) {
            outputQueue.push(opStack.pop());
          }
          opStack.push(token.value);
        }
      }

      while (opStack.length > 0) {
        outputQueue.push(opStack.pop());
      }

      // Evaluate RPN
      const evalStack = [];
      for (const item of outputQueue) {
        if (typeof item === 'number') {
          evalStack.push(item);
        } else {
          const b = evalStack.pop();
          const a = evalStack.pop();
          const res = this._computeBinary(a, b, item);
          if (res === null) return null;
          evalStack.push(res);
        }
      }

      return evalStack[0] ?? 0;
    } catch {
      this._setError('Calculation error');
      return null;
    }
  }

  _factorial(n) {
    if (n === 0 || n === 1) return 1;
    let val = 1;
    for (let i = 2; i <= n; i++) val *= i;
    return val;
  }

  _setError(msg) {
    this.isError = true;
    this.errorMessage = msg;
    this.currentInput = msg;
    this.expressionTokens = [];
    this.storedValue = null;
    this.pendingOperator = null;
    this.scientificTokens = [];
    this.isWaitingForOperand = false;
  }

  _addHistory(expr, result) {
    this.historyItems.unshift({ expression: expr, result });
    if (this.historyItems.length > 50) this.historyItems.pop();
  }

  _round(val) {
    return Math.round(val * 1e12) / 1e12;
  }

  _formatResult(num) {
    if (!Number.isFinite(num)) {
      this._setError('Overflow');
      return 'Overflow';
    }
    const rounded = this._round(num);
    return rounded.toString();
  }

  _formatDisplay(val) {
    if (typeof val === 'number') {
      return this._round(val).toLocaleString('en-US', { maximumFractionDigits: 10 });
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 10 });
    }
    return val.toString();
  }

  _getOperatorSymbol(op) {
    switch (op) {
      case Operator.ADD: return '+';
      case Operator.SUBTRACT: return '-';
      case Operator.MULTIPLY: return '×';
      case Operator.DIVIDE: return '÷';
      case Operator.POWER_Y: return '^';
      case Operator.ROOT_X: return 'yroot';
      default: return '';
    }
  }

  // --- Display Representation ---
  getPrimaryDisplay() {
    if (this.isError) return this.errorMessage;
    const parts = this.currentInput.split('.');
    const integerPart = parseFloat(parts[0]).toLocaleString('en-US');
    if (parts.length > 1) {
      return `${integerPart}.${parts[1]}`;
    }
    return this.currentInput === '-0' ? '-0' : integerPart;
  }

  getExpressionDisplay() {
    return this.expressionTokens.join(' ');
  }

  hasMemory() {
    return this.memoryItems.length > 0;
  }
}
