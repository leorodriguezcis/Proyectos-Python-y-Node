import Mapper from './AbstractMapper';
import { MapExceptions } from './MapExceptions';

function MapperExceptionsClass<Source, Target>(mapper: Mapper<Source, Target>) {
  return function <T extends { new (...args: any[]): any }>(target: T) {
    for (const key of Object.getOwnPropertyNames(target.prototype)) {
      let descriptor = Object.getOwnPropertyDescriptor(target.prototype, key);
      if (key !== 'constructor' && descriptor) {
        descriptor = MapExceptions(mapper)({ constructor: target }, key, descriptor);
        Object.defineProperty(target.prototype, key, descriptor);
      }
    }
  };
}

export default MapperExceptionsClass;
