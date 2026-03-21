// node:test 기반 calc.js 테스트

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add, subtract, multiply, divide } from './calc.js';

test('add: 두 양수 합산', () => {
  assert.equal(add(2, 3), 5);
});

test('add: 음수 포함 합산', () => {
  assert.equal(add(-1, 4), 3);
});

test('subtract: 두 수 뺄셈', () => {
  assert.equal(subtract(10, 4), 6);
});

test('subtract: 결과가 음수', () => {
  assert.equal(subtract(3, 7), -4);
});

test('multiply: 두 수 곱셈', () => {
  assert.equal(multiply(3, 4), 12);
});

test('multiply: 0 곱셈', () => {
  assert.equal(multiply(5, 0), 0);
});

test('divide: 두 수 나눗셈', () => {
  assert.equal(divide(10, 2), 5);
});

test('divide: 0으로 나누면 에러 발생', () => {
  assert.throws(
    () => divide(5, 0),
    { message: '0으로 나눌 수 없습니다' }
  );
});
