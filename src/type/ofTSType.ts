import * as AST from '@babel/types';
import { bug, err } from '../util/err';
import * as Types from './types';
import * as Type from './constructors';

/**
 * Babel TSType AST(パースされた型の表現)を独自のType表現に変換する
 * @param tsType Babelの型表現
 * @returns 独自定義の型表現 Type
 */
export default function ofTSType(tsType: AST.TSType): Types.Type {
  switch (tsType.type) {
    // null, boolean, number, string については独自定義の型へと変換
    case 'TSNullKeyword': return Type.nullType;
    case 'TSBooleanKeyword': return Type.boolean;
    case 'TSNumberKeyword': return Type.number;
    case 'TSStringKeyword': return Type.string;

    // リテラル
    case 'TSTypeLiteral': {
      const props: Types.ObjectProp[] =
        tsType.members.map(mem => {
          // 未実装の部分についてはerrorをthrowする(never型)
          if (!AST.isTSPropertySignature(mem)) {
            bug(`unimplemented ${mem.type}`);
          }
          if (!AST.isIdentifier(mem.key)) {
            bug(`unimplemented ${mem.key.type}`);
          }
          if (!mem.typeAnnotation) {
            err(`type required for ${mem.key.name}`, mem);
          }
          return {
            name: mem.key.name,
            type: ofTSType(mem.typeAnnotation.typeAnnotation)
          };
        });
      return Type.object(props);
    }

    case 'TSFunctionType': {
      const args =
        tsType.parameters.map(param => {
          if (!AST.isIdentifier(param)) bug(`unimplemented ${param.type}`);
          if (!param.typeAnnotation) bug(`expected type for ${param.name}`);
          if (!AST.isTSTypeAnnotation(param.typeAnnotation)) bug(`unimplemented ${param.typeAnnotation.type}`);
          return ofTSType(param.typeAnnotation.typeAnnotation);
        });
      if (!tsType.typeAnnotation) bug(`expected return type`);
      const ret = ofTSType(tsType.typeAnnotation.typeAnnotation);
      return Type.functionType(args, ret);
    }

    default: bug(`unimplemented ${tsType.type}`);
  }
}
