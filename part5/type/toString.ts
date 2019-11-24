import { Type } from './types';

export default function toString(type: Type): string {
  switch (type.type) {
    case 'Never':   return 'never';
    case 'Unknown': return 'unknown';
    case 'Null':    return 'null';
    case 'Boolean': return 'boolean';
    case 'Number':  return 'number';
    case 'String':  return 'string';

    case 'Object': {
      const props =
        Object.entries(type.properties).map(([ name, type ]) => `${name}: ${toString(type)}`);
      return `{ ${props.join(', ')} }`;
    }

    case 'Function': {
      const args = type.args.map(toString);
      return `(${args.join(', ')}) => ${type.ret}`
    }

    case 'Singleton':
      if (type.base.type === 'String')
        return `'${type.value}'`;
      else
        return `${type.value}`;

    case 'Union':
      return type.types
        .map(type => {
          const typeString = toString(type);
          if (type.type === 'Function')
            return `(${typeString})`
          else
            return typeString;
        })
        .join(' | ');

    case 'Intersection':
      return type.types
        .map(type => {
          const typeString = toString(type);
          if (type.type === 'Function' || type.type === 'Union')
            return `(${typeString})`
          else
            return typeString;
        })
        .join(' & ');
  }
}
