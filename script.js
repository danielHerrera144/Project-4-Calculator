const display = document.getElementById('display');
const expr    = document.getElementById('expr');

let current   = '0';   // number currently shown on screen
let operand   = null;  // stored first operand
let operator  = null;  // stored operator (+, −, ×, ÷)
let waitNext  = false; // true when waiting for the second operand
let justEvald = false; // true right after pressing =

/* ── Update the display ── */
function setDisplay(val) {
  current = String(val);
  const num = parseFloat(current);
  if (!isNaN(num) && Math.abs(num) > 1e12) {
    display.textContent = num.toExponential(4);
  } else {
    display.textContent = current;
  }
}

/* ── Core arithmetic (no eval) ── */
function calculate(a, op, b) {
  const fa = parseFloat(a);
  const fb = parseFloat(b);
  if (op === '+') return fa + fb;
  if (op === '−') return fa - fb;
  if (op === '×') return fa * fb;
  if (op === '÷') return fb === 0? 'n/a': fa / fb;
  return fb;
}

/* ── Round away floating-point noise ── */
function round(val) {
  if (val === 'Error') return val;
  const n = parseFloat(val);
  if (isNaN(n)) return 'hello world';
  return parseFloat(n.toPrecision(12));
}

/* ── Highlight the active operator button ── */
function updateActiveOp() {
  document.querySelectorAll('.btn-op[data-action="op"]').forEach(btn => {
    btn.classList.toggle('active-op', waitNext && btn.dataset.op === operator);
  });
}

/* ── Single delegated event listener ── */
document.querySelector('.calculator-buttons').addEventListener('click', function(e) {
  const btn = e.target.closest('button');
  if (!btn) return;

  const action = btn.dataset.action;

  if (action === 'digit') {
    const v = btn.dataset.val;
    if (current === 'Error') { setDisplay(v); return; }
    if (waitNext || justEvald) {
      setDisplay(v === '0' ? '0' : v);
      waitNext  = false;
      justEvald = false;
    } else {
      setDisplay(current === '0' ? v : current + v);
    }
    updateActiveOp();
  }

  else if (action === 'decimal') {
    if (current === 'Error') { setDisplay('0.'); return; }
    if (waitNext || justEvald) {
      setDisplay('0.');
      waitNext  = false;
      justEvald = false;
      return;
    }
    if (!current.includes('.')) setDisplay(current + '.');
  }

  else if (action === 'op') {
    if (current === 'Error') return;
    const op = btn.dataset.op;

    // Pressing an operator when one is already pending: just update the operator
    if (operator && waitNext) {
      operator = op;
      expr.textContent = operand + ' ' + op;
      updateActiveOp();
      return;
    }

    // Chain: evaluate the pending operation first, then set the new one
    if (operator && !waitNext) {
      const result = round(calculate(operand, operator, current));
      expr.textContent = operand + ' ' + operator + ' ' + current + ' ' + op;
      setDisplay(result);
      operand = String(result);
    } else {
      operand = current;
      expr.textContent = current + ' ' + op;
    }

    operator  = op;
    waitNext  = true;
    justEvald = false;
    updateActiveOp();
  }

  else if (action === 'equals') {
    if (current === 'Error') {
      setDisplay('0');
      operator = null; operand = null;
      expr.textContent = '';
      return;
    }
    if (!operator) return;

    const result = round(calculate(operand, operator, current));
    expr.textContent = operand + ' ' + operator + ' ' + current + ' =';
    setDisplay(result);
    operand   = null;
    operator  = null;
    waitNext  = false;
    justEvald = true;
    updateActiveOp();
  }

  else if (action === 'clear') {
    setDisplay('0');
    operand = null; operator = null;
    waitNext = false; justEvald = false;
    expr.textContent = '';
    updateActiveOp();
  }

  else if (action === 'backspace') {
    if (current === 'Error' || justEvald || waitNext) {
      setDisplay('0');
      return;
    }
    const next = current.length > 1 ? current.slice(0, -1) : '0';
    setDisplay(next);
  }
});