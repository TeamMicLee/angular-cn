/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {asyncFallback} from './async_fallback';

/**
 * Wraps a test function in an asynchronous test zone. The test will automatically
 * complete when all asynchronous calls within this zone are done. Can be used
 * to wrap an {@link inject} call.
 *
 * 把一个测试函数包装进一个异步测试区域（Zone）。当该区域中的所有异步调用都已完成时，该测试将会自动完成。
 * 可用于包装 {@link inject} 调用。
 *
 * Example:
 *
 * 例子：
 *
 * ```
 * it('...', async(inject([AClass], (object) => {
 *   object.doSomething.then(() => {
 *     expect(...);
 *   })
 * });
 * ```
 *
 * @publicApi
 */
export function async(fn: Function): (done: any) => any {
  const _Zone: any = typeof Zone !== 'undefined' ? Zone : null;
  if (!_Zone) {
    return function() {
      return Promise.reject(
          'Zone is needed for the async() test helper but could not be found. ' +
          'Please make sure that your environment includes zone.js/dist/zone.js');
    };
  }
  const asyncTest = _Zone && _Zone[_Zone.__symbol__('asyncTest')];
  if (typeof asyncTest === 'function') {
    return asyncTest(fn);
  }
  // not using new version of zone.js
  // TODO @JiaLiPassion, remove this after all library updated to
  // newest version of zone.js(0.8.25)
  return asyncFallback(fn);
}
