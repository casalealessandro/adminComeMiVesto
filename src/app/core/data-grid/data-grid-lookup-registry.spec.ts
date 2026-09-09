import { GridLookupRegistry } from './data-grid-lookup-registry';

describe('GridLookupRegistry cache', () => {
  let registry: GridLookupRegistry;

  beforeEach(() => {
    registry = new GridLookupRegistry();
  });

  it('should preserve uncached lookup behavior by default', async () => {
    const load = jasmine.createSpy('load').and.resolveTo({ id: 'CAT-1', name: 'Categoria 1' });
    registry.setProviders({ categories: { load } });

    const lookup = { providerKey: 'categories' };
    const request = { value: 'CAT-1', dataField: 'categoryId' };

    await registry.load('categoryId', lookup, request);
    await registry.load('categoryId', lookup, request);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('should reuse a cached result for repeated provider and value lookups', async () => {
    const resolved = { id: 'CAT-1', name: 'Categoria 1' };
    const load = jasmine.createSpy('load').and.resolveTo(resolved);
    registry.setProviders({ categories: { load } });

    const lookup = { providerKey: 'categories', cache: true };
    const request = { value: 'CAT-1', dataField: 'categoryId' };

    const first = await registry.load('categoryId', lookup, request);
    const second = await registry.load('categoryId', lookup, request);

    expect(first).toBe(resolved);
    expect(second).toBe(resolved);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('should deduplicate concurrent requests for the same cached lookup', async () => {
    let resolveLoad!: (value: any) => void;
    const pending = new Promise(resolve => {
      resolveLoad = resolve;
    });
    const load = jasmine.createSpy('load').and.returnValue(pending);
    registry.setProviders({ categories: { load } });

    const lookup = { providerKey: 'categories', cache: true };
    const request = { value: 'CAT-1', dataField: 'categoryId' };

    const first = registry.load('categoryId', lookup, request);
    const second = registry.load('categoryId', lookup, request);

    expect(load).toHaveBeenCalledTimes(1);

    const resolved = { id: 'CAT-1', name: 'Categoria 1' };
    resolveLoad(resolved);

    expect(await first).toBe(resolved);
    expect(await second).toBe(resolved);
  });

  it('should support a custom cache key when lookup identity depends on row context', async () => {
    const load = jasmine.createSpy('load').and.callFake(async request => ({
      id: request.value,
      locale: request.rowData.locale,
    }));
    registry.setProviders({ categories: { load } });

    const lookup = {
      providerKey: 'categories',
      cache: true,
      cacheKey: (request: any) => `${request.value}-${request.rowData.locale}`,
    };

    const italian = await registry.load('categoryId', lookup, {
      value: 'CAT-1',
      rowData: { locale: 'it' },
      dataField: 'categoryId',
    });
    const english = await registry.load('categoryId', lookup, {
      value: 'CAT-1',
      rowData: { locale: 'en' },
      dataField: 'categoryId',
    });
    const italianAgain = await registry.load('categoryId', lookup, {
      value: 'CAT-1',
      rowData: { locale: 'it' },
      dataField: 'categoryId',
    });

    expect(load).toHaveBeenCalledTimes(2);
    expect(italian).toEqual({ id: 'CAT-1', locale: 'it' });
    expect(english).toEqual({ id: 'CAT-1', locale: 'en' });
    expect(italianAgain).toBe(italian);
  });

  it('should invalidate cached values explicitly and when providers are replaced', async () => {
    const firstProviderLoad = jasmine.createSpy('firstProviderLoad').and.resolveTo({ version: 1 });
    const secondProviderLoad = jasmine.createSpy('secondProviderLoad').and.resolveTo({ version: 2 });
    const lookup = { providerKey: 'categories', cache: true };
    const request = { value: 'CAT-1', dataField: 'categoryId' };

    registry.setProviders({ categories: { load: firstProviderLoad } });
    await registry.load('categoryId', lookup, request);
    await registry.load('categoryId', lookup, request);
    expect(firstProviderLoad).toHaveBeenCalledTimes(1);

    registry.clearCache('categories');
    await registry.load('categoryId', lookup, request);
    expect(firstProviderLoad).toHaveBeenCalledTimes(2);

    registry.setProviders({ categories: { load: secondProviderLoad } });
    const resolved = await registry.load('categoryId', lookup, request);

    expect(secondProviderLoad).toHaveBeenCalledTimes(1);
    expect(resolved).toEqual({ version: 2 });
  });

  it('should not allow an invalidated in-flight request to repopulate the cache', async () => {
    let resolveFirst!: (value: any) => void;
    const firstPending = new Promise(resolve => {
      resolveFirst = resolve;
    });
    const load = jasmine.createSpy('load')
      .and.returnValues(firstPending, Promise.resolve({ version: 2 }));

    registry.setProviders({ categories: { load } });

    const lookup = { providerKey: 'categories', cache: true };
    const request = { value: 'CAT-1', dataField: 'categoryId' };

    const first = registry.load('categoryId', lookup, request);
    registry.clearCache('categories');

    const second = await registry.load('categoryId', lookup, request);
    expect(second).toEqual({ version: 2 });

    resolveFirst({ version: 1 });
    await first;

    const third = await registry.load('categoryId', lookup, request);

    expect(load).toHaveBeenCalledTimes(2);
    expect(third).toEqual({ version: 2 });
  });
});
