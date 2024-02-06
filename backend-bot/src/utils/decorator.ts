/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */
type MetadataEntry = { key: any; value: any };

const createFunctionDecorator = <T = any>(
  func: (fn: ((...args: any[]) => T) | undefined, thisArg: any, ...args: any[]) => T,
) => {
  return <R>(
    target: R,
    propertyKey: string,
    descriptor?: TypedPropertyDescriptor<(...args: any[]) => T>,
  ): TypedPropertyDescriptor<(...args: any[]) => T> => {
    const entries = getMetadata(descriptor.value);
    descriptor.value = generateNamedFunction(func, descriptor);
    defineMetadata(descriptor.value, entries);
    return descriptor;
  };
};

function generateNamedFunction<T>(
  func: (fn: ((...args: any[]) => T) | undefined, thisArg: any, ...args: any[]) => T,
  descriptor?: TypedPropertyDescriptor<(...args: any[]) => T>,
) {
  const fn = descriptor.value;
  return {
    [fn.name]: function <T>(this: T, ...args: any[]) {
      return func(fn, this, ...args);
    },
  }[descriptor.value.name];
}

function getMetadata<T>(target: T): Array<MetadataEntry> {
  const keys = Reflect.getMetadataKeys(target);
  return keys.map((key) => ({ key, value: Reflect.getMetadata(key, target) }));
}

function defineMetadata<T>(target: T, entries: Array<MetadataEntry>): void {
  entries.forEach(({ key, value }) => Reflect.defineMetadata(key, value, target));
}

export { createFunctionDecorator };
