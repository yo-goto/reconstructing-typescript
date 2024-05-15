import * as AST from '@babel/types';
import { bug, err } from '../util/err';
import * as Trace from '../util/trace';
import Type from '../type';
import check from './check';
import Env from './env';

const synthIdentifier = Trace.instrument('synthIdentifier',
function synthIdentifier(env: Env, ast: AST.Identifier): Type {
  const type = env.get(ast.name);
  if (!type) err(`unbound identifier '${ast.name}'`, ast);
  return type;
}
);

// ---------------------
// リテラル値の場合の型合成(独自定義の型への変換)
// ---------------------
/**
 * Null型の合成(独自定義の型への変換)
 */
const synthNull = Trace.instrument('synthNull',
function synthNull(env: Env, ast: AST.NullLiteral): Type {
  return Type.nullType;
}
);


/**
 * Boolean型の合成(独自定義の型への変換)
 */
const synthBoolean = Trace.instrument('synthBoolean',
function synthBoolean(env: Env, ast: AST.BooleanLiteral): Type {
  return Type.boolean;
}
);


/**
 * Number型の合成(独自定義の型への変換)
 */
const synthNumber = Trace.instrument('synthNumber',
function (env: Env, ast: AST.NumericLiteral): Type {
  return Type.number;
}
);


/**
 * String型の合成(独自定義の型への変換)
 */
const synthString = Trace.instrument('synthString',
function synthString(env: Env, ast: AST.StringLiteral): Type {
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
function synthObject(env: Env, ast: AST.ObjectExpression): Type {
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
        type: synth(env, prop.value)
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
function synthMember(env: Env, ast: AST.MemberExpression): Type {
  const prop = ast.property;
  if (!AST.isIdentifier(prop)) {
    bug(`unimplemented ${prop.type}`);
  }
  if (ast.computed) {
    bug(`unimplemented computed`);
  }

  // メンバー式の左側がオブジェクト型であることを検証してオブジェクト型を得る
  const object = synth(env, ast.object);
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
function synthTSAs(env: Env, ast: AST.TSAsExpression): Type {
  // 式のAST表現を独自定義の型へ変換
  const type = Type.ofTSType(ast.typeAnnotation);
  // const x = 1 as string; // as式
  //           ^:式 => AST
  //             ^^^^^^^^^:既知の型 => Type
  check(env, ast.expression, type); // 式を型に照合する
  // => as式は合成から照合に切り替えることを伝えている
  return type;
}
);

const synthFunction = Trace.instrument('synthFunction',
function synthFunction(env: Env, ast: AST.ArrowFunctionExpression): Type {
  if (!AST.isExpression(ast.body)) bug(`unimplemented ${ast.body.type}`)
  const bindings = ast.params.map(param => {
    if (!AST.isIdentifier(param)) bug(`unimplemented ${param.type}`);
    if (!param.typeAnnotation) err(`type required for '${param.name}'`, param);
    if (!AST.isTSTypeAnnotation(param.typeAnnotation)) bug(`unimplemented ${param.type}`);
    return {
      name: param.name,
      type: Type.ofTSType(param.typeAnnotation.typeAnnotation),
    };
  });
  const args = bindings.map(({ type }) => type);
  const bodyEnv =
    bindings.reduce(
      (env, { name, type }) => env.set(name, type),
      env
    );
  const ret = synth(bodyEnv, ast.body);
  return Type.functionType(args, ret);
}
);

const synthCall = Trace.instrument('synthCall',
function synthCall(env: Env, ast: AST.CallExpression): Type {
  if (!AST.isExpression(ast.callee)) bug(`unimplemented ${ast.callee.type}`);
  const callee = synth(env, ast.callee);
  if (!Type.isFunction(callee)) err(`call expects function`, ast.callee);
  if (callee.args.length !== ast.arguments.length)
    err(`expected ${callee.args.length} args, got ${ast.arguments.length} args`, ast);
  callee.args.forEach((type, i) => {
    const arg = ast.arguments[i];
    if (!AST.isExpression(arg)) bug(`unimplemented ${arg.type}`)
    check(env, arg, type);
  });
  return callee.ret;
}
);

/**
 * ボトムアップの式から型の合成(独自定義の型への変換)
 * @param ast Babelの型表現AST
 * @returns 型表現 Type
 */
const synth = Trace.instrument('synth',
function synth(env: Env, ast: AST.Expression): Type {
  switch (ast.type) {
    // astの最上位の型についてcase分けして独自定義の型表現に変換
    case 'Identifier':              return synthIdentifier(env, ast);
    case 'NullLiteral':             return synthNull(env, ast);

    // プリミティブなリテラル値の場合は対応する型をそのまま返す
    case 'NullLiteral':      return synthNull(env, ast);
    case 'BooleanLiteral':   return synthBoolean(env, ast);
    case 'NumericLiteral':   return synthNumber(env, ast);
    case 'StringLiteral':    return synthString(env, ast);

    // オブジェクト式: { x: 1 }
    case 'ObjectExpression': return synthObject(env, ast);
    // member式: foo.bar
    case 'MemberExpression': return synthMember(env, ast);
    // as式: 1 as number
    case 'TSAsExpression':   return synthTSAs(env, ast);

    case 'ArrowFunctionExpression': return synthFunction(env, ast);
    case 'CallExpression':          return synthCall(env, ast);

    // 未実装の型の場合はthrow
    default: bug(`unimplemented ${ast.type}`);
  }
}
);

export default synth;
