import * as Trace from '../util/trace';
import * as Types from './types';
import propType from './propType';
import * as Type from './validators';

/**
 * 部分型の検査(第一引数の型が第二引数の型の部分型であるかを検査)
 * @param fst 部分型を期待する型
 * @param snd 上位型を期待する型
 * @returns 真偽値 (fst <: snd => true)
 */
const isSubtype = Trace.instrument('isSubtype',
function (fst: Types.Type, snd: Types.Type): boolean {
  // プリミティブ型の比較(シンプルなケース)
  // 両方ともにNull型である
  if (Type.isNull(fst) && Type.isNull(snd)) return true;
  // 両方ともにBoolean型である
  if (Type.isBoolean(fst) && Type.isBoolean(snd)) return true;
  // 両方ともにNumber型である
  if (Type.isNumber(fst) && Type.isNumber(snd)) return true;
  // 両方ともにString型である
  if (Type.isString(fst) && Type.isString(snd)) return true;

  // 両方ともオブジェクト型である場合
  if (Type.isObject(fst) && Type.isObject(snd)) {
    // snd型のすべてのプロパティがfst型に存在しているなら fst <: snd
    // fst::{ x: number, y: number } <: snd::{ x: number }
    // => より制約が強い型の方が部分型である
    return snd.properties
      .every(({ name: sndPropName, type: sndPropType }) => {
        // sndのプロパティがfstにあるかを検証
        const fstPropType = propType(fst, sndPropName);
        if (!fstPropType) {
          // sndのいずれかのプロパティがfstに無いならsndはfstの部分型ではない
          return false;
        }
        else {
          // fstPropTypeが存在している場合には再帰的に検証
          return isSubtype(fstPropType, sndPropType);
        }
      });
  }

  if (Type.isFunction(fst) && Type.isFunction(snd)) {
    return fst.args.length === fst.args.length &&
      fst.args.every((a, i) => isSubtype(snd.args[i], a)) &&
      isSubtype(fst.ret, snd.ret);
  }

  // どのケースにもあてはまらないなら部分型検証を失敗させる
  return false;
}
);

export default isSubtype;
