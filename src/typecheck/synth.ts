import * as AST from '@babel/types';
import { bug, err } from '../util/err';
import * as Trace from '../util/trace';
import Type from '../type';
import check from './check';

// ---------------------
// リテラル値の場合の型合成(独自定義の型への変換)
// ---------------------
/**
 * Null型の合成(独自定義の型への変換)
 */
const synthNull = Trace.instrument('synthNull',
function synthNull (ast: AST.NullLiteral): Type {
  return Type.nullType;
}
);


/**
 * Boolean型の合成(独自定義の型への変換)
 */
const synthBoolean = Trace.instrument('synthBoolean',
function synthBoolean(ast: AST.BooleanLiteral): Type {
  return Type.boolean;
}
);


/**
 * Number型の合成(独自定義の型への変換)
 */
const synthNumber = Trace.instrument('synthNumber',
function (ast: AST.NumericLiteral): Type {
  return Type.number;
}
);


/**
 * String型の合成(独自定義の型への変換)
 */
const synthString = Trace.instrument('synthString',
function synthString(ast: AST.StringLiteral): Type {
  return Type.string;
}
);


// ---------------------
// オブジェクト型の場合の型合成(独自定義の型への変換)
// ---------------------
/**
 * オブジェクト型の場合の独自定義の型への変換(独自定義の型への変換)
 * 各プロパティの値式の型を合成して、オブジェクト型を作成する
 */
const synthObject = Trace.instrument('synthObject',
function synthObject(ast: AST.ObjectExpression): Type {
  const properties: Type.Object["properties"] =
    ast.properties.map(prop => {
      if (!AST.isObjectProperty(prop)) {
        bug(`unimplemented ${prop.type}`);
      }
      if (!AST.isIdentifier(prop.key)) {
        bug(`unimplemented ${prop.key.type}`);
      }
      if (!AST.isExpression(prop.value)) {
        bug(`unimplemented ${prop.value.type}`);
      }
      if (prop.computed) {
        bug(`unimplemented computed`);
      }
      // オブジェクトのプロパティ表現の型
      return {
        name: prop.key.name,
        type: synth(prop.value)
      };
    });
  return Type.object(properties);
}
);

/**
 * メンバー式の場合の型合成(独自定義の型への変換)
 * 左側の型を合成して、オブジェクトかつ指定のプロパティが存在することを確認
 * そのプロパティの型を返す
 * ex) foo.bar => barの型を返す
 */
const synthMember = Trace.instrument('synthMember',
function synthMember(ast: AST.MemberExpression): Type {
  const prop = ast.property;
  if (!AST.isIdentifier(prop)) {
    bug(`unimplemented ${prop.type}`);
  }
  if (ast.computed) {
    bug(`unimplemented computed`);
  }

  // メンバー式の左側がオブジェクト型であることを検証してオブジェクト型を得る
  const object = synth(ast.object);
  if (!Type.isObject(object)) {
    err('. expects object', ast.object);
  }
  // オブジェクトのプロパティの型を取得(あれば)
  const type = Type.propType(object, prop.name);
  if (!type) {
    // 指定したプロパティが無い場合はthrow
    err(`no such property ${prop.name}`, prop);
  }
  // オブジェクトのプロパティの型を返す
  return type;
}
);

/**
 * as式の場合の型合成(独自定義の型への変換)
 * 式をas式の型に照合するため切り替えが発生する
 */
const synthTSAs = Trace.instrument('synthTSAs',
function synthTSAs(ast: AST.TSAsExpression): Type {
  // 式のAST表現を独自定義の型へ変換
  const type = Type.ofTSType(ast.typeAnnotation);
  // const x = 1 as string; // as式
  //           ^:式 => AST
  //             ^^^^^^^^^:既知の型 => Type
  check(ast.expression, type); // 式を型に照合する
  // => as式は合成から照合に切り替えることを伝えている
  return type;
}
);

/**
 * ボトムアップの式から型の合成(独自定義の型への変換)
 * @param ast Babelの型表現AST
 * @returns 型表現 Type
 */
const synth = Trace.instrument('synth',
function synth(ast: AST.Expression): Type {
  switch (ast.type) {
    // astの最上位の型についてcase分けして独自定義の型表現に変換

    // プリミティブなリテラル値の場合は対応する型をそのまま返す
    case 'NullLiteral':      return synthNull(ast);
    case 'BooleanLiteral':   return synthBoolean(ast);
    case 'NumericLiteral':   return synthNumber(ast);
    case 'StringLiteral':    return synthString(ast);

    // オブジェクト式: { x: 1 }
    case 'ObjectExpression': return synthObject(ast);
    // member式: foo.bar
    case 'MemberExpression': return synthMember(ast);
    // as式: 1 as number
    case 'TSAsExpression':   return synthTSAs(ast);

    // 未実装の型の場合はthrow
    default: bug(`unimplemented ${ast.type}`);
  }
}
);

export default synth;
