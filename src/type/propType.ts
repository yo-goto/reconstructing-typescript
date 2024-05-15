import { Object, Type } from './types';

/**
 * オブジェクトのプロパティの型を取得する
 * @param type オブジェクト型
 * @param name プロパティ名
 * @returns プロパティの型(あれば)
 */
export default function propType(
  type: Object,
  name: string
): Type | undefined {
  const prop = type.properties.find(({ name: propName }) => propName === name);
  if (prop) {
    return prop.type;
  }
}
