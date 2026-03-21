// 사칙연산 ESM 모듈

/**
 * 두 수를 더한다.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function add(a, b) {
  return a + b;
}

/**
 * 두 수를 뺀다.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function subtract(a, b) {
  return a - b;
}

/**
 * 두 수를 곱한다.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function multiply(a, b) {
  return a * b;
}

/**
 * 두 수를 나눈다. 0으로 나누면 에러를 던진다.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 * @throws {Error} 0으로 나눌 수 없습니다
 */
export function divide(a, b) {
  if (b === 0) {
    throw new Error('0으로 나눌 수 없습니다');
  }
  return a / b;
}
