import { expect } from 'chai';
import { stub } from 'sinon';
import { CacheObject, CachePolicy } from './CachePolicy';

describe('CachePolicy', () => {
  it('should use provided cache key', async () => {
    const fn = stub().resolves(30);

    const cacheMock = {
      get: stub().onFirstCall().resolves(undefined).resolves(30),
      set: stub(),
    };
    const policy = new CachePolicy(cacheMock as CacheObject);

    await policy.execute(fn, undefined, {
      key: 'CacheKey',
    });
    expect(cacheMock.get.callCount).to.equal(1);
    expect(cacheMock.get.getCall(0).args[0]).to.equal('CacheKey');
    expect(await cacheMock.get.getCall(0).returnValue).to.equal(undefined);
    expect(fn.callCount).to.equal(1);
    expect(cacheMock.set.callCount).to.equal(1);
    expect(cacheMock.set.getCall(0).args[0]).to.equal('CacheKey');
    expect(cacheMock.set.getCall(0).args[1]).to.equal(30);

    await policy.execute(fn, undefined, {
      key: 'CacheKey',
    });
    expect(cacheMock.get.getCall(1).args[0]).to.equal('CacheKey');
    expect(await cacheMock.get.getCall(1).returnValue).to.equal(30);

    await policy.execute(fn, undefined, {
      key: 'CacheKey',
    });
    expect(cacheMock.get.getCall(2).args[0]).to.equal('CacheKey');
    expect(await cacheMock.get.getCall(2).returnValue).to.equal(30);

    expect(fn.callCount).to.equal(1);
    expect(cacheMock.get.callCount).to.equal(3);
    expect(cacheMock.set.callCount).to.equal(1);
  });

  it('should use Function.name as part of cache key', async () => {
    const func0Result = 'f0';
    const func1Result = 'f1';
    const func0 = stub().resolves(func0Result);
    const func1 = stub().resolves(func1Result);

    const cacheMock = {
      get: stub()
        .onFirstCall()
        .resolves(undefined)
        .onSecondCall()
        .resolves(undefined)
        .resolves(func0Result),
      set: stub(),
    };
    const policy = new CachePolicy(cacheMock as CacheObject);

    await policy.execute(func0);
    await policy.execute(func1);
    await policy.execute(func0);

    expect(cacheMock.get.callCount).to.equal(3);
    expect(cacheMock.get.getCall(0).args[0]).to.include(`CachePolicy::${func0.name}::`);
    expect(await cacheMock.get.getCall(0).returnValue).to.equal(undefined);
    expect(cacheMock.get.getCall(1).args[0]).to.include(`CachePolicy::${func1.name}::`);
    expect(await cacheMock.get.getCall(1).returnValue).to.equal(undefined);
    expect(cacheMock.get.getCall(2).args[0]).to.include(`CachePolicy::${func0.name}::`);
    expect(await cacheMock.get.getCall(2).returnValue).to.equal(func0Result);

    expect(cacheMock.set.callCount).to.equal(2);
    expect(cacheMock.set.getCall(0).args[0]).to.include(`CachePolicy::${func0.name}::`);
    expect(cacheMock.set.getCall(0).args[1]).to.equal(func0Result);
    expect(cacheMock.set.getCall(1).args[0]).to.include(`CachePolicy::${func1.name}::`);
    expect(cacheMock.set.getCall(1).args[1]).to.equal(func1Result);

    expect(func0.callCount).to.equal(1);
    expect(func1.callCount).to.equal(1);
  });

  it('should use default cache key for anonymous function', async () => {
    const cacheMock = {
      get: stub().onFirstCall().resolves(undefined).resolves(10),
      set: stub(),
    };
    const policy = new CachePolicy(cacheMock as CacheObject);

    await policy.execute(() => 10);
    await policy.execute(() => 10);

    expect(cacheMock.get.callCount).to.equal(2);

    expect(cacheMock.get.getCall(0).args[0]).to.include(`CachePolicy::`);
    expect(cacheMock.get.getCall(0).args[0].length).to.greaterThan(`CachePolicy::`.length);
    expect(await cacheMock.get.getCall(0).returnValue).to.equal(undefined);

    expect(cacheMock.get.getCall(1).args[0]).to.equal(cacheMock.get.getCall(0).args[0]);
    expect(await cacheMock.get.getCall(1).returnValue).to.equal(10);

    expect(cacheMock.set.callCount).to.equal(1);
    expect(cacheMock.set.getCall(0).args[0]).to.equal(cacheMock.get.getCall(0).args[0]);
    expect(cacheMock.set.getCall(0).args[1]).to.equal(10);
  });
});
