// @flow

import test from 'ava';
import {
  parse
} from '../helpers';

const attributeValueOperators = [
  '=',
  '~=',
  '|=',
  '^=',
  '$=',
  '*='
];

for (const attributeValueOperator of attributeValueOperators) {
  test('valid comparison operator: [foo' + attributeValueOperator + '"bar"]', (t): void => {
    const tokens = parse('[foo' + attributeValueOperator + '"bar"]');

    if (tokens[0].type !== 'selector') {
      throw new Error('Unexpected state.');
    }

    t.deepEqual(
      tokens[0].body[0],
      {
        name: 'foo',
        operator: attributeValueOperator,
        type: 'attributeValueSelector',
        value: 'bar'
      }
    );
  });
}

const validAttributeValues = [
  'foo',
  'FOO',
  'a123',
  'a-123',
  '_123',
  '_-'
];

for (const validAttributeValue of validAttributeValues) {
  test('valid attribute value: [foo="' + validAttributeValue + '"]', (t): void => {
    const tokens = parse('[foo="' + validAttributeValue + '"]');

    if (tokens[0].type !== 'selector') {
      throw new Error('Unexpected state.');
    }

    t.deepEqual(
      tokens[0].body[0],
      {
        name: 'foo',
        operator: '=',
        type: 'attributeValueSelector',
        value: /^['"]/.test(validAttributeValue) ? validAttributeValue.slice(1, -1) : validAttributeValue
      }
    );
  });
}

const invalidAttributeValues = [
  '=',
  '[',
  ']',
  ',',
  'foo bar',
  '"',
  '\''
];

for (const invalidAttributeValue of invalidAttributeValues) {
  test('invalid attribute value: [foo="' + invalidAttributeValue + '"]', (t): void => {
    t.throws(() => {
      parse('[foo=' + invalidAttributeValue + ']');
    });
  });
}

for (const booleanValue of [true, false]) {
  test('valid attribute boolean value: [foo=' + String(booleanValue) + ']', (t): void => {
    const tokens = parse('[foo=' + String(booleanValue) + ']');

    if (tokens[0].type !== 'selector') {
      throw new Error('Unexpected state.');
    }

    t.deepEqual(
      tokens[0].body[0],
      {
        name: 'foo',
        operator: '=',
        type: 'attributeValueSelector',
        value: booleanValue
      }
    );
  });
}

// eslint-disable-next-line no-undefined
for (const falsyPrimitive of [NaN, null, undefined]) {
  test('valid attribute falsy value: [foo=' + String(falsyPrimitive) + ']', (t): void => {
    const tokens = parse('[foo=' + String(falsyPrimitive) + ']');

    if (tokens[0].type !== 'selector') {
      throw new Error('Unexpected state.');
    }

    t.deepEqual(
      tokens[0].body[0],
      {
        name: 'foo',
        operator: '=',
        type: 'attributeValueSelector',
        value: falsyPrimitive
      }
    );
  });
}

for (const numericValue of [NaN, 123, -234, -3.323, 3.343, '+3', '+4.0', Infinity, '+Infinity', -Infinity]) {
  test('valid attribute numeric value: [foo=' + String(numericValue) + ']', (t): void => {
    const tokens = parse('[foo=' + String(numericValue) + ']');

    if (tokens[0].type !== 'selector') {
      throw new Error('Unexpected state.');
    }

    t.deepEqual(
      tokens[0].body[0],
      {
        name: 'foo',
        operator: '=',
        type: 'attributeValueSelector',
        value: parseFloat(numericValue)
      }
    );
  });
}
