import { bug, err } from "../util/err.js";
import Type from "../type/index.js";
import check from "./check.js";

function synthIdentifier(env, ast) {
  const type = env.get(ast.name);
  if (!type) err(`unbound identifier '${ast.name}'`, ast);
  return type;
}

function synthNull(env, ast) {
  return Type.nullType;
}

function synthBoolean(env, ast) {
  return Type.boolean;
}

function synthNumber(env, ast) {
  return Type.number;
}

function synthString(env, ast) {
  return Type.string;
}

function synthObject(env, ast) {
  const properties = ast.properties.map(prop => {
    if (prop.type !== "ObjectProperty") bug(`unimplemented ${prop.type}`);
    if (prop.computed) bug(`unimplemented computed`);
    if (prop.key.type !== "Identifier") bug(`unimplemented ${prop.key.type}`);
    return {
      name: prop.key.name,
      type: synth(env, prop.value)
    };
  });
  return Type.object(properties);
}

function synthMember(env, ast) {
  if (ast.computed) bug(`unimplemented computed`);
  const prop = ast.property;
  if (prop.type !== "Identifier") bug(`unimplemented ${prop.type}`);
  const object = synth(env, ast.object);
  if (object.type !== "Object") err(". expects object", ast.object);
  const typeProp = object.properties.find(({
    name: typeName
  }) => typeName === prop.name);
  if (!typeProp) err(`no such property ${prop.name}`, prop);
  return typeProp.type;
}

function synthFunction(env, ast) {
  const argTypes = ast.params.map(param => {
    if (param.type !== "Identifier") bug(`unimplemented ${param.type}`);
    if (!param.typeAnnotation) err(`type required for '${param.name}'`, param);
    if (param.typeAnnotation.type !== "TSTypeAnnotation") bug(`unimplemented ${param.type}`);
    return {
      name: param.name,
      type: Type.ofTSType(param.typeAnnotation.typeAnnotation)
    };
  });
  const args = argTypes.map(({
    name,
    type
  }) => type);
  const bodyEnv = argTypes.reduce((env2, {
    name,
    type
  }) => env2.set(name, type), env);
  const ret = synth(bodyEnv, ast.body);
  return Type.functionType(args, ret);
}

function synthCall(env, ast) {
  const callee = synth(env, ast.callee);
  if (callee.type !== "Function") err(`call expects function`, ast.callee);
  if (callee.args.length !== ast.arguments.length) err(`expected ${callee.args.length} args, got ${ast.arguments.length} args`, ast);
  callee.args.forEach((arg, i) => {
    check(env, ast.arguments[i], arg);
  });
  return callee.ret;
}

export default function synth(env, ast) {
  switch (ast.type) {
    case "Identifier":
      return synthIdentifier(env, ast);

    case "NullLiteral":
      return synthNull(env, ast);

    case "BooleanLiteral":
      return synthBoolean(env, ast);

    case "NumericLiteral":
      return synthNumber(env, ast);

    case "StringLiteral":
      return synthString(env, ast);

    case "ObjectExpression":
      return synthObject(env, ast);

    case "MemberExpression":
      return synthMember(env, ast);

    case "ArrowFunctionExpression":
      return synthFunction(env, ast);

    case "CallExpression":
      return synthCall(env, ast);

    default:
      bug(`unimplemented ${ast.type}`);
  }
}