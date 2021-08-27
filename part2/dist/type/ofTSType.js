import { bug } from "../util/err.js";
import * as Type from "./constructors.js";
export default function ofTSType(tsType) {
  switch (tsType.type) {
    case "TSNullKeyword":
      return Type.nullType;

    case "TSBooleanKeyword":
      return Type.boolean;

    case "TSNumberKeyword":
      return Type.number;

    case "TSStringKeyword":
      return Type.string;

    case "TSTypeLiteral":
      {
        const props = tsType.members.map(mem => {
          if (mem.type !== "TSPropertySignature") bug(`unimplemented ${mem.type}`);
          if (mem.key.type !== "Identifier") bug(`unimplemented ${mem.key.type}`);
          if (!mem.typeAnnotation) bug(`expected type for ${mem.key.name}`);
          return {
            name: mem.key.name,
            type: ofTSType(mem.typeAnnotation.typeAnnotation)
          };
        });
        return Type.object(props);
      }

    case "TSFunctionType":
      {
        const args = tsType.parameters.map(param => {
          if (param.type !== "Identifier") bug(`unimplemented ${param.type}`);
          if (!param.typeAnnotation) bug(`expected type for ${param.name}`);
          if (param.typeAnnotation.type !== "TSTypeAnnotation") bug(`unimplemented ${param.typeAnnotation.type}`);
          return ofTSType(param.typeAnnotation.typeAnnotation);
        });
        if (!tsType.typeAnnotation) bug(`expected return type`);
        const ret = ofTSType(tsType.typeAnnotation.typeAnnotation);
        return Type.functionType(args, ret);
      }

    default:
      bug(`unimplemented ${tsType.type}`);
  }
}