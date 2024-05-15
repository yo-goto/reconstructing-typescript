import * as AST from '@babel/types';
import * as Babel from '@babel/parser';
import { bug } from '../util/err';
import Type from '../type';

/**
 * コード文字列をASTにパースする
 * @param input コードの文字列
 * @returns BabelのAST表現
 */
export function parseExpression(input: string): AST.Expression {
  return Babel.parseExpression(input, {
    plugins: [ 'typescript' ],
    attachComment: false,
  });
}

/**
 * 型の独自パース as
 * @param input 文字列
 * @returns 独自型定義の表現 Type
 */
export function parseType(input: string): Type {
  const ast = parseExpression(`_ as ${input}`);
  if (!AST.isTSAsExpression(ast)) {
    // as式ではない場合にはエラー
    bug(`unexpected ${ast.type}`);
  }
  return Type.ofTSType(ast.typeAnnotation);
}
