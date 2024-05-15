import * as Parse from '../ast/parse'
import Type from './index';

/**
 * 部分型関係を検証するヘルパー関数 (fst <: snd => true)
 * @param fst 部分型を期待する型
 * @param snd 上位型を期待する型
 */
function expectIsSubtype(fst: string, snd: string) {
  const aAst = Parse.parseType(fst); // 型のast表現
  const bAst = Parse.parseType(snd); // 型のast表現
  return expect(Type.isSubtype(aAst, bAst));
}

describe('primitives', () => {
  it('number <: number', () => {
    expectIsSubtype('number', 'number').toBe(true);
  });

  it('number </: string', () => {
    expectIsSubtype('number', 'string').toBe(false);
  });
});

describe('objects', () => {
  it('ok', () => {
    expectIsSubtype(
      '{ foo: number, bar: boolean, baz: string }', // 制約の強い方が部分型
      '{ bar: boolean, foo: number }'
    ).toBe(true);
  });

  it('missing field', () => {
    expectIsSubtype(
      '{ foo: number }',
      '{ bar: boolean, foo: number }'
    ).toBe(false);
  });

  it('incompatible field', () => {
    expectIsSubtype(
      '{ foo: number }',
      '{ foo: boolean }'
    ).toBe(false);
  });
});
