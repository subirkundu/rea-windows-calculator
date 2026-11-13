#!/usr/bin/env node
import { CalcEngine, Mode, Operator, UnaryOperator } from './src/calc-engine.js';
import readline from 'node:readline';

const args = process.argv.slice(2);

if (args.length > 0) {
  const expr = args.join(' ');
  console.log(`Calculating: ${expr}`);
  // Evaluate basic expression using CalcEngine
  const calc = new CalcEngine(Mode.SCIENTIFIC);
  const tokens = expr.match(/(\d+\.?\d*|\+|\-|\*|\/|\^|sqrt|sqr|fact|\%|\(|\))/gi) || [];

  for (const token of tokens) {
    if (!isNaN(parseFloat(token))) {
      const num = parseFloat(token);
      calc.currentInput = num.toString();
      calc.isWaitingForOperand = false;
    } else if (token === '+') {
      calc.applyOperator(Operator.ADD);
    } else if (token === '-') {
      calc.applyOperator(Operator.SUBTRACT);
    } else if (token === '*' || token === '×') {
      calc.applyOperator(Operator.MULTIPLY);
    } else if (token === '/' || token === '÷') {
      calc.applyOperator(Operator.DIVIDE);
    } else if (token === '^') {
      calc.applyOperator(Operator.POWER_Y);
    } else if (token.toLowerCase() === 'sqrt') {
      calc.applyUnary(UnaryOperator.SQRT);
    } else if (token === '%') {
      calc.applyUnary(UnaryOperator.PERCENT);
    }
  }
  calc.calculate();
  console.log(`Result: ${calc.getPrimaryDisplay()}`);
  process.exit(0);
}

console.log('--- REA Reconstructed Calculator CLI ---');
console.log('Type a calculation (e.g. 50 + 25) or "exit" to quit:\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'calc> '
});

rl.prompt();

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (trimmed === 'exit' || trimmed === 'quit') {
    rl.close();
    return;
  }
  if (!trimmed) {
    rl.prompt();
    return;
  }
  try {
    const calc = new CalcEngine(Mode.SCIENTIFIC);
    const tokens = trimmed.match(/(\d+\.?\d*|\+|\-|\*|\/|\^|sqrt|sqr|fact|\%)/gi) || [];
    for (const token of tokens) {
      if (!isNaN(parseFloat(token))) {
        calc.currentInput = token;
        calc.isWaitingForOperand = false;
      } else if (token === '+') calc.applyOperator(Operator.ADD);
      else if (token === '-') calc.applyOperator(Operator.SUBTRACT);
      else if (token === '*' || token === '×') calc.applyOperator(Operator.MULTIPLY);
      else if (token === '/' || token === '÷') calc.applyOperator(Operator.DIVIDE);
      else if (token === '^') calc.applyOperator(Operator.POWER_Y);
      else if (token.toLowerCase() === 'sqrt') calc.applyUnary(UnaryOperator.SQRT);
      else if (token === '%') calc.applyUnary(UnaryOperator.PERCENT);
    }
    calc.calculate();
    console.log(`= ${calc.getPrimaryDisplay()}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
  rl.prompt();
});
