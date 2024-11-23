const cache = new Map();

const cacheMethodCalls = (object, methodsToFlushCacheWith = []) => {
  const handler = {
    get: (module, methodName) => {
      const method = module[methodName];
      return async (...methodArgs) => {
        if (methodsToFlushCacheWith.includes(methodName)) {
          cache.clear();
          return await method.apply(this, methodArgs);
        }

        const cacheKey = `${methodName}-${JSON.stringify(methodArgs)}`;

        if (!cache.has(cacheKey)) {
          cache.set(cacheKey, await method.apply(this, methodArgs));
        }

        return cache.get(cacheKey);
      };
    },
  };

  return new Proxy(object, handler);
};


export { cacheMethodCalls };