import * as Types from './types';

// 独自定義した型のオブジェクトによる値表現
export const nullType: Types.Null = { type: 'Null' };
export const boolean: Types.Boolean = { type: 'Boolean' };
export const number: Types.Number = { type: 'Number' };
export const string: Types.String = { type: 'String' };

/**
 * オブジェクト型のコンストラクター
 * @param properties 2パターンの引数(プロパティ表現の型 or プロンプト名: 型)
 * @returns オブジェクト型
 */
export function object(
  properties: Types.ObjectProp[] | { [name: string]: Types.Type }
): Types.Object {
  if (Array.isArray(properties)) {
    // propertiesが配列なら
    return { type: 'Object', properties }
  } else {
    // { x: number } のような形式の引数の場合には配列に変形して再帰処理
    return object(Object.entries(properties).map(([name, type]) => ({ name, type })));
  }
}

/**
 * 関数型のコンストラクター
 * @param args 引数の型
 * @param ret 戻り値の型
 * @returns 関数型表現
 */
export function functionType(args: Types.Type[], ret: Types.Type): Types.Function {
  return { type: 'Function', args, ret };
}
