// すべての型を表現する型
export type Type =
  | Null
  | Boolean
  | Number
  | String
  | Object;

// 型を表現するオブジェクトの型(値はコンストラクターで作成される)
export type Null = { type: 'Null' };
export type Boolean = { type: 'Boolean' };
export type Number = { type: 'Number' };
export type String = { type: 'String' };

/**
 * オブジェクト型のプロパティの表現
 */
export type ObjectProp = { name: string; type: Type; };
/**
 * オブジェクト型のパースは以下のようになる
 * { x: number; y: number; }
 * ↓
 * {
 *   type: 'Object',
 *   properties: [
 *     { name: 'x', type: { type: 'Number' } },
 *     { name: 'y', type: { type: 'Number' } }
 *   ]
 * }
 */
export type Object = {
  type: 'Object';
  properties: ObjectProp[];
};
