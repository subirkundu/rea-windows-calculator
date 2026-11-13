import { CalcEngine, Mode, Operator, UnaryOperator } from '../src/calc-engine.js';
import assert from 'node:assert/strict';

function testBasicOperations() {
  const calc = new CalcEngine(Mode.STANDARD);
  
  // Test 7 + 8 = 15
  calc.inputDigit(7);
  calc.applyOperator(Operator.ADD);
  calc.inputDigit(8);
  calc.calculate();
  assert.equal(calc.getPrimaryDisplay(), '15');
  assert.equal(calc.historyItems.length, 1);
  assert.equal(calc.historyItems[0].expression, '7 + 8 =');
  assert.equal(calc.historyItems[0].result, '15');

  // Test 15 * 3 = 45
  calc.applyOperator(Operator.MULTIPLY);
  calc.inputDigit(3);
  calc.calculate();
  assert.equal(calc.getPrimaryDisplay(), '45');

  // Test 45 - 5 = 40
  calc.applyOperator(Operator.SUBTRACT);
  calc.inputDigit(5);
  calc.calculate();
  assert.equal(calc.getPrimaryDisplay(), '40');

  // Test 40 / 4 = 10
  calc.applyOperator(Operator.DIVIDE);
  calc.inputDigit(4);
  calc.calculate();
  assert.equal(calc.getPrimaryDisplay(), '10');

  console.log('✔ Basic operations passed');
}

function testUnaryOperations() {
  const calc = new CalcEngine(Mode.STANDARD);

  // Test √16 = 4
  calc.inputDigit(1);
  calc.inputDigit(6);
  calc.applyUnary(UnaryOperator.SQRT);
  assert.equal(calc.getPrimaryDisplay(), '4');

  // Test 4^2 = 16
  calc.applyUnary(UnaryOperator.SQUARE);
  assert.equal(calc.getPrimaryDisplay(), '16');

  // Test 1/16 = 0.0625
  calc.applyUnary(UnaryOperator.RECIPROCAL);
  assert.equal(calc.getPrimaryDisplay(), '0.0625');

  // Test +/- Negate
  calc.clear();
  calc.inputDigit(5);
  calc.applyUnary(UnaryOperator.NEGATE);
  assert.equal(calc.getPrimaryDisplay(), '-5');
  calc.applyUnary(UnaryOperator.NEGATE);
  assert.equal(calc.getPrimaryDisplay(), '5');

  console.log('✔ Unary operations passed');
}

function testDivisionByZero() {
  const calc = new CalcEngine(Mode.STANDARD);
  calc.inputDigit(9);
  calc.applyOperator(Operator.DIVIDE);
  calc.inputDigit(0);
  calc.calculate();
  assert.equal(calc.isError, true);
  assert.equal(calc.getPrimaryDisplay(), 'Cannot divide by zero');

  // Clear resets error
  calc.clear();
  assert.equal(calc.isError, false);
  assert.equal(calc.getPrimaryDisplay(), '0');

  console.log('✔ Division by zero handling passed');
}

function testMemory() {
  const calc = new CalcEngine(Mode.STANDARD);
  assert.equal(calc.hasMemory(), false);

  calc.inputDigit(5);
  calc.inputDigit(0);
  calc.memoryStore();
  assert.equal(calc.hasMemory(), true);
  assert.equal(calc.memoryItems[0], 50);

  calc.clear();
  calc.memoryRecall();
  assert.equal(calc.getPrimaryDisplay(), '50');

  calc.inputDigit(2);
  calc.inputDigit(5);
  calc.memoryAdd();
  assert.equal(calc.memoryItems[0], 75);

  calc.inputDigit(1);
  calc.inputDigit(0);
  calc.memorySubtract();
  assert.equal(calc.memoryItems[0], 65);

  calc.memoryClear();
  assert.equal(calc.hasMemory(), false);

  console.log('✔ Memory functions passed');
}

function testScientificPrecedence() {
  const calc = new CalcEngine(Mode.SCIENTIFIC);

  // 2 + 3 * 4 = 14 (Standard would be 20)
  calc.inputDigit(2);
  calc.applyOperator(Operator.ADD);
  calc.inputDigit(3);
  calc.applyOperator(Operator.MULTIPLY);
  calc.inputDigit(4);
  calc.calculate();
  assert.equal(calc.getPrimaryDisplay(), '14');

  // Factorial 5! = 120
  calc.clear();
  calc.inputDigit(5);
  calc.applyUnary(UnaryOperator.FACTORIAL);
  assert.equal(calc.getPrimaryDisplay(), '120');

  console.log('✔ Scientific order of operations passed');
}

console.log('Running Calculator Engine Tests...');
testBasicOperations();
testUnaryOperations();
testDivisionByZero();
testMemory();
testScientificPrecedence();
console.log('🎉 All 5 test suites passed successfully!');
