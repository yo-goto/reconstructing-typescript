import * as Types from './types';

// バリデーター関数の定義
/**
 * Null型であるかの述語
 */
export function isNull(type: Types.Type): type is Types.Null {
  return type.type === 'Null';
}

/**
 * Boolean型であるかの述語
 */
export function isBoolean(type: Types.Type): type is Types.Boolean {
  return type.type === 'Boolean';
}

/**
 * Number型であるかの述語
 */
export function isNumber(type: Types.Type): type is Types.Number {
  return type.type === 'Number';
}

/**
 * String型であるかの述語
 */
export function isString(type: Types.Type): type is Types.String {
  return type.type === 'String';
}

/**
 * Object型であるかの述語
 */
export function isObject(type: Types.Type): type is Types.Object {
  return type.type === 'Object';
}

export function isFunction(type: Types.Type): type is Types.Function {
  return type.type === 'Function';
}
