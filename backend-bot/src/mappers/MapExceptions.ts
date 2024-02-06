import { createFunctionDecorator } from 'src/utils/decorator';
import Mapper from './AbstractMapper';

const catchAndMapError = <Source, Target>(mapper: Mapper<Source, Target>, error: any) => {
  return mapper.map(error);
};

function catchAndMapPromiseError<T, Source, Target>(
  mapper: Mapper<Source, Target>,
  result: Promise<T>,
): Promise<T> {
  return Promise.allSettled([result]).then(([asyncResult]: [PromiseSettledResult<T>]) => {
    if (asyncResult.status === 'rejected') throw catchAndMapError(mapper, asyncResult.reason);
    return asyncResult.value;
  });
}

export const MapExceptions = <Source, Target>(mapper: Mapper<Source, Target>) =>
  createFunctionDecorator(function (fn, thisArg, ...args) {
    try {
      let result = fn.call(thisArg, ...args);
      if (result instanceof Promise) result = catchAndMapPromiseError(mapper, result);
      return result;
    } catch (error) {
      throw catchAndMapError(mapper, error);
    }
  });
