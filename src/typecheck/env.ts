import Type from '../type';

// 型環境を表す型
type Env = {
  get(name: string): Type | undefined;
  set(name: string, type: Type): Env;
  entries(): IterableIterator<[string, Type]>;
}

// 型環境のコンストラクター
function Env(map: Map<string, Type> | { [name: string]: Type }): Env {
  if (map instanceof Map) {
    // 最終的にはEnv型オブジェクトを返す
    return {
      get: (name: string) => map.get(name),
      set: (name: string, type: Type) =>
        Env(new Map([...map, [name, type]])),
      // 古い環境をコピーして束縛を追加した新しい環境を返す
      entries: () => map.entries()
    }
  } else {
    // 再起的に呼び出すためにMapに変換している
    return Env(new Map(Object.entries(map)));
  }
}

module Env {
  export const empty = Env({});
}

export default Env;
