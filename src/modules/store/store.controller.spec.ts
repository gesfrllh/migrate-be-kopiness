import { StoreController } from './store.controller';

describe('StoreController', () => {
  it('registers literal mine route before slug parameter route', () => {
    const routes = Reflect.getMetadata('path', StoreController) as string;
    const methods = Object.getOwnPropertyNames(StoreController.prototype);

    expect(routes).toBe('stores');
    expect(methods.indexOf('findMine')).toBeLessThan(methods.indexOf('findBySlug'));
  });
});
