import { Node } from '@babel/types';
import print from '../ast/print';

export class Bug extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export function bug(msg: string): never {
  throw new Bug(msg);
}

export class Err extends Error {
  constructor(msg: string, public location?: string) {
    super(location ? `${msg} at ${location}` : msg);
  }
}

export function err(msg: string, location?: string | Node): never {
  if (location) {
    if (typeof location === 'string')
      throw new Err(msg, location);
    else
      throw new Err(msg, print(location));

  } else {
    throw new Err(msg);
  }
}
