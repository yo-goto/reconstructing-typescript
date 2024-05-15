import * as AST from '@babel/types';
import { bug, err } from '../util/err';
import * as Trace from '../util/trace';
import Type from '../type';
import synth from './synth';

type AstProp = {
  name: string;
  expr: AST.Expression;
  key: AST.Identifier;
};

/**
 * オブジェクト式の分解 (検証がどこかで失敗する場合にはthrowされる)
 * @param ast BabelのAST表現によるオブジェクト式
 * @param type 独自定義のObject型
 */
const checkObject = Trace.instrument('checkObject',
function checkObject(
  ast: AST.ObjectExpression,
  type: Type.Object
): void {
  // 照合したいオブジェクト式のプロパティの配列
  const astProps: AstProp[] =
    ast.properties.map(prop => {
      if (!AST.isObjectProperty(prop)) {
        bug(`unimplemented ${prop.type}`);
      }
      if (prop.computed) {
        bug(`unimplemented computed`);
      }
      if (!AST.isIdentifier(prop.key)) {
        bug(`unimplemented ${prop.key.type}`);
      }
      if (!AST.isExpression(prop.value)) {
        bug(`unimplemented ${prop.value.type}`);
      }

      return {
        name: prop.key.name,
        expr: prop.value,
        key: prop.key
      };
    });

  // 式::{ x: 1, y: 2 }
  // 型::{ x: number; y: number }

  // 既知のオブジェクト型のプロパティについて照合したいオブジェクト式のプロパティがあるかどうかを調べる
  type.properties.forEach(({ name }) => {
    const astProp = astProps.find(({ name: astName }) => astName === name);
    if (!astProp) {
      // 照合の検査が失敗する (必要なプロパティが式に存在しない)
      err(`missing property ${name}`, ast);
    }
  });

  // 既知のオブジェクト型のプロパティとして存在していない余計なプロパティが照合したいオブジェクト式のプロパティにないかどうかを調べる
  astProps.forEach(({ name, expr, key }) => {
    const propType = Type.propType(type, name);
    if (propType) {
      // 部分式(プロパティの値)について型を照合
      check(expr, propType);
    }
    else {
      // 照合の検査が失敗する (余計なプロパティが式に存在する)
      err(`extra property ${name}`, key);
    }
  });
}
);

/**
 * 式を既知の型に照合
 * @param ast BabelのAST表現による式
 * @param type 独自定義の型(照合対象の既知の型)
 */
const check = Trace.instrument('check',
function check(
  ast: AST.Expression,
  type: Type
): void {
  // astがオブジェクト式の場合かつ、照合対象がオブジェクト型である場合
  if (AST.isObjectExpression(ast) && Type.isObject(type)) {
    return checkObject(ast, type);
  }

  // 上記以外の場合には、astの式から型を合成して部分型の検証を行う
  const synthType = synth(ast);

  // 式は照合対象の既知の型の部分型である必要がある
  if (!Type.isSubtype(synthType, type)) {
    // 合成結果の型が部分型ではないなら照合に失敗
    err(`expected ${Type.toString(type)}, got ${Type.toString(synthType)}`, ast);
  }

  /*
  function fn1(x: 1 | 2) {}
  const x: number = 1;
  fn1(x); => fail
  --------------------------
  function fn2(y: number) {}
  const y: 1 | 2 = 1;
  fn2(y); => succeed
  */
}
);

export default check;
