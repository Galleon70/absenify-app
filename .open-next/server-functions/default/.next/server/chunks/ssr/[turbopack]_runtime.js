var RUNTIME_PUBLIC_PATH = "server/chunks/ssr/[turbopack]_runtime.js";
var RELATIVE_ROOT_PATH = "..";
var ASSET_PREFIX = "/_next/";
// Apply forwarded globals from workerData if running in a worker thread
if (typeof require !== 'undefined') {
    try {
        var { workerData } = require('worker_threads');
        if (workerData?.__turbopack_globals__) {
            Object.assign(globalThis, workerData.__turbopack_globals__);
            // Remove internal data so it's not visible to user code
            delete workerData.__turbopack_globals__;
        }
    } catch (_) {
        // Not in a worker thread context, ignore
    }
}
/**
 * This file contains runtime types and functions that are shared between all
 * TurboPack ECMAScript runtimes.
 *
 * It will be prepended to the runtime code of each runtime.
 */ /* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-types.d.ts" />
/// <reference path="./async-module.ts" />
/**
 * Describes why a module was instantiated.
 * Shared between browser and Node.js runtimes.
 */ var SourceType = /*#__PURE__*/ function(SourceType) {
    /**
   * The module was instantiated because it was included in an evaluated chunk's
   * runtime.
   * SourceData is a ChunkPath.
   */ SourceType[SourceType["Runtime"] = 0] = "Runtime";
    /**
   * The module was instantiated because a parent module imported it.
   * SourceData is a ModuleId.
   */ SourceType[SourceType["Parent"] = 1] = "Parent";
    /**
   * The module was instantiated because it was included in a chunk's hot module
   * update.
   * SourceData is an array of ModuleIds or undefined.
   */ SourceType[SourceType["Update"] = 2] = "Update";
    return SourceType;
}(SourceType || {});
/**
 * Flag indicating which module object type to create when a module is merged. Set to `true`
 * by each runtime that uses ModuleWithDirection (browser dev-base.ts, nodejs dev-base.ts,
 * nodejs build-base.ts). Browser production (build-base.ts) leaves it as `false` since it
 * uses plain Module objects.
 */ let createModuleWithDirectionFlag = false;
const REEXPORTED_OBJECTS = new WeakMap();
/**
 * Constructs the `__turbopack_context__` object for a module.
 */ function Context(module, exports) {
    this.m = module;
    // We need to store this here instead of accessing it from the module object to:
    // 1. Make it available to factories directly, since we rewrite `this` to
    //    `__turbopack_context__.e` in CJS modules.
    // 2. Support async modules which rewrite `module.exports` to a promise, so we
    //    can still access the original exports object from functions like
    //    `esmExport`
    // Ideally we could find a new approach for async modules and drop this property altogether.
    this.e = exports;
}
const contextPrototype = Context.prototype;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag;
function defineProp(obj, name, options) {
    if (!hasOwnProperty.call(obj, name)) Object.defineProperty(obj, name, options);
}
function getOverwrittenModule(moduleCache, id) {
    let module = moduleCache[id];
    if (!module) {
        if (createModuleWithDirectionFlag) {
            // set in development modes for hmr support
            module = createModuleWithDirection(id);
        } else {
            module = createModuleObject(id);
        }
        moduleCache[id] = module;
    }
    return module;
}
/**
 * Creates the module object. Only done here to ensure all module objects have the same shape.
 */ function createModuleObject(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined
    };
}
function createModuleWithDirection(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined,
        parents: [],
        children: []
    };
}
const BindingTag_Value = 0;
/**
 * Adds the getters to the exports object.
 */ function esm(exports, bindings, dynamic) {
    defineProp(exports, '__esModule', {
        value: true
    });
    if (toStringTag) defineProp(exports, toStringTag, {
        value: 'Module'
    });
    let i = 0;
    while(i < bindings.length){
        const propName = bindings[i++];
        const tagOrFunction = bindings[i++];
        if (typeof tagOrFunction === 'number') {
            if (tagOrFunction === BindingTag_Value) {
                defineProp(exports, propName, {
                    value: bindings[i++],
                    enumerable: true,
                    writable: false
                });
            } else {
                throw new Error(`unexpected tag: ${tagOrFunction}`);
            }
        } else {
            const getterFn = tagOrFunction;
            if (typeof bindings[i] === 'function') {
                const setterFn = bindings[i++];
                defineProp(exports, propName, {
                    get: getterFn,
                    set: setterFn,
                    enumerable: true
                });
            } else {
                defineProp(exports, propName, {
                    get: getterFn,
                    enumerable: true
                });
            }
        }
    }
    // The properties defined above are already non-configurable and
    // non-writable, so the namespace's existing exports are effectively
    // immutable. Sealing additionally makes the object non-extensible, matching
    // real ESM-namespace semantics. Modules with dynamic re-exports
    // (`export *` from a CommonJS module) must stay extensible so the dynamic
    // export proxy can surface keys discovered at runtime, so skip the seal for
    // them.
    if (!dynamic) Object.seal(exports);
}
/**
 * Makes the module an ESM with exports
 */ function esmExport(bindings, id, dynamic) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    module.namespaceObject = exports;
    esm(exports, bindings, dynamic);
}
contextPrototype.s = esmExport;
function ensureDynamicExports(module, exports) {
    let reexportedObjects = REEXPORTED_OBJECTS.get(module);
    if (!reexportedObjects) {
        REEXPORTED_OBJECTS.set(module, reexportedObjects = []);
        // Returns the re-exported object that provides `prop` as an own property,
        // or `undefined` if none does. The traps share this logic so they always
        // agree on which keys are synthesized from `reexportedObjects`. `default`
        // is never re-exported by `export *`, so it is never synthesized.
        const reexportOwning = (prop)=>{
            if (prop !== 'default') {
                for (const obj of reexportedObjects){
                    if (hasOwnProperty.call(obj, prop)) return obj;
                }
            }
            return undefined;
        };
        // Modules with dynamic re-exports are not sealed by `esm()`, so the
        // target beneath the namespace stays extensible. That is what lets the
        // `ownKeys` and `getOwnPropertyDescriptor` traps legally report keys that
        // exist on `reexportedObjects` but not on the target itself.
        module.exports = module.namespaceObject = new Proxy(exports, {
            get (target, prop) {
                if (hasOwnProperty.call(target, prop) || prop === 'default' || prop === '__esModule') {
                    return Reflect.get(target, prop);
                }
                const obj = reexportOwning(prop);
                return obj && Reflect.get(obj, prop);
            },
            // The namespace is read-only, like a real esm namespace object. The
            // re-exported modules can still mutate their own exports (exposed live
            // via `get`), but mutating the namespace itself is rejected. Refusing
            // here, rather than forwarding to the extensible target, also prevents an
            // assignment/definition from shadowing a dynamic re-export. It also
            // prevents delete from removing a static export.
            set () {
                return false;
            },
            defineProperty () {
                return false;
            },
            deleteProperty () {
                return false;
            },
            // The `has` trap ensures that `'exportName' in starImports` will reflect
            // the truth of whether a key is exported.
            has (target, prop) {
                if (Reflect.has(target, prop)) return true;
                if (prop === 'default' || prop === '__esModule') return false;
                return reexportOwning(prop) !== undefined;
            },
            // ownKeys and getOwnPropertyDescriptor together make the keys enumerable.
            // If a value is returned from `ownKeys` but its property descriptor is
            // not enumerable, it will not be visible to iterator methods.
            // Collectively, they allow code like the following:
            //
            // ```
            // // module.js re-exports dynamic CJS exports
            // export * from './legacyModule.cjs'
            //
            // // from another JS file, reference the re-exported dynamic values
            // import * as Namespace from './module.js'
            // Object.keys(Namespace)
            // ```
            ownKeys (target) {
                const keys = Reflect.ownKeys(target);
                for (const obj of reexportedObjects){
                    for (const key of Reflect.ownKeys(obj)){
                        if (key !== 'default' && !keys.includes(key)) keys.push(key);
                    }
                }
                return keys;
            },
            getOwnPropertyDescriptor (target, prop) {
                const own = Reflect.getOwnPropertyDescriptor(target, prop);
                if (own || prop === 'default' || prop === '__esModule') return own;
                const obj = reexportOwning(prop);
                if (obj) {
                    // Synthetic keys don't exist on the target, so they MUST be
                    // reported as configurable. However the set/delete traps above will
                    // prevent them from actually being changed
                    return {
                        enumerable: true,
                        configurable: true,
                        get: ()=>Reflect.get(obj, prop)
                    };
                }
                return undefined;
            }
        });
    }
    return reexportedObjects;
}
/**
 * Dynamically exports properties from an object
 */ function dynamicExport(object, id) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    const reexportedObjects = ensureDynamicExports(module, exports);
    if (typeof object === 'object' && object !== null) {
        reexportedObjects.push(object);
    }
}
contextPrototype.j = dynamicExport;
function exportValue(value, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = value;
}
contextPrototype.v = exportValue;
function exportNamespace(namespace, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = module.namespaceObject = namespace;
}
contextPrototype.n = exportNamespace;
function createGetter(obj, key) {
    return ()=>obj[key];
}
/**
 * @returns prototype of the object
 */ const getProto = Object.getPrototypeOf ? (obj)=>Object.getPrototypeOf(obj) : (obj)=>obj.__proto__;
/** Prototypes that are not expanded for exports */ const LEAF_PROTOTYPES = [
    null,
    getProto({}),
    getProto([]),
    getProto(getProto)
];
/**
 * @param raw
 * @param ns
 * @param allowExportDefault
 *   * `false`: will have the raw module as default export
 *   * `true`: will have the default property as default export
 */ function interopEsm(raw, ns, allowExportDefault) {
    const bindings = [];
    let defaultLocation = -1;
    for(let current = raw; (typeof current === 'object' || typeof current === 'function') && !LEAF_PROTOTYPES.includes(current); current = getProto(current)){
        for (const key of Object.getOwnPropertyNames(current)){
            bindings.push(key, createGetter(raw, key));
            if (defaultLocation === -1 && key === 'default') {
                defaultLocation = bindings.length - 1;
            }
        }
    }
    // this is not really correct
    // we should set the `default` getter if the imported module is a `.cjs file`
    if (!(allowExportDefault && defaultLocation >= 0)) {
        // Replace the binding with one for the namespace itself in order to preserve iteration order.
        if (defaultLocation >= 0) {
            // Replace the getter with the value
            bindings.splice(defaultLocation, 1, BindingTag_Value, raw);
        } else {
            bindings.push('default', BindingTag_Value, raw);
        }
    }
    esm(ns, bindings);
    return ns;
}
function createNS(raw) {
    if (typeof raw === 'function') {
        return function(...args) {
            return raw.apply(this, args);
        };
    } else {
        return Object.create(null);
    }
}
function esmImport(id) {
    const module = getOrInstantiateModuleFromParent(id, this.m);
    // any ES module has to have `module.namespaceObject` defined.
    if (module.namespaceObject) return module.namespaceObject;
    // only ESM can be an async module, so we don't need to worry about exports being a promise here.
    const raw = module.exports;
    return module.namespaceObject = interopEsm(raw, createNS(raw), raw && raw.__esModule);
}
contextPrototype.i = esmImport;
function asyncLoader(moduleId) {
    const loader = this.r(moduleId);
    return loader(esmImport.bind(this));
}
contextPrototype.A = asyncLoader;
// Add a simple runtime require so that environments without one can still pass
// `typeof require` CommonJS checks so that exports are correctly registered.
const runtimeRequire = // @ts-ignore
typeof require === 'function' ? require : function require1() {
    throw new Error('Unexpected use of runtime require');
};
contextPrototype.t = runtimeRequire;
function commonJsRequire(id) {
    return getOrInstantiateModuleFromParent(id, this.m).exports;
}
contextPrototype.r = commonJsRequire;
/**
 * Remove fragments and query parameters since they are never part of the context map keys
 *
 * This matches how we parse patterns at resolving time.  Arguably we should only do this for
 * strings passed to `import` but the resolve does it for `import` and `require` and so we do
 * here as well.
 */ function parseRequest(request) {
    // Per the URI spec fragments can contain `?` characters, so we should trim it off first
    // https://datatracker.ietf.org/doc/html/rfc3986#section-3.5
    const hashIndex = request.indexOf('#');
    if (hashIndex !== -1) {
        request = request.substring(0, hashIndex);
    }
    const queryIndex = request.indexOf('?');
    if (queryIndex !== -1) {
        request = request.substring(0, queryIndex);
    }
    return request;
}
/**
 * `require.context` and require/import expression runtime.
 */ function moduleContext(map) {
    function moduleContext(id) {
        id = parseRequest(id);
        if (hasOwnProperty.call(map, id)) {
            return map[id].module();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    }
    moduleContext.keys = ()=>{
        return Object.keys(map);
    };
    moduleContext.resolve = (id)=>{
        id = parseRequest(id);
        if (hasOwnProperty.call(map, id)) {
            return map[id].id();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    };
    moduleContext.import = async (id)=>{
        return await moduleContext(id);
    };
    return moduleContext;
}
contextPrototype.f = moduleContext;
/**
 * Returns the path of a chunk defined by its data.
 */ function getChunkPath(chunkData) {
    return typeof chunkData === 'string' ? chunkData : chunkData.path;
}
// Load the CompressedmoduleFactories of a chunk into the `moduleFactories` Map.
// The CompressedModuleFactories format is
// - 1 or more module ids
// - a module factory function
// So walking this is a little complex but the flat structure is also fast to
// traverse, we can use `typeof` operators to distinguish the two cases.
function installCompressedModuleFactories(chunkModules, offset, moduleFactories, newModuleId) {
    let i = offset;
    while(i < chunkModules.length){
        let end = i + 1;
        // Find our factory function
        while(end < chunkModules.length && typeof chunkModules[end] !== 'function'){
            end++;
        }
        if (end === chunkModules.length) {
            throw new Error('malformed chunk format, expected a factory function');
        }
        // Install the factory for each module ID that doesn't already have one.
        // When some IDs in this group already have a factory, reuse that existing
        // group factory for the missing IDs to keep all IDs in the group consistent.
        // Otherwise, install the factory from this chunk.
        const moduleFactoryFn = chunkModules[end];
        let existingGroupFactory = undefined;
        for(let j = i; j < end; j++){
            const id = chunkModules[j];
            const existingFactory = moduleFactories.get(id);
            if (existingFactory) {
                existingGroupFactory = existingFactory;
                break;
            }
        }
        const factoryToInstall = existingGroupFactory ?? moduleFactoryFn;
        let didInstallFactory = false;
        for(let j = i; j < end; j++){
            const id = chunkModules[j];
            if (!moduleFactories.has(id)) {
                if (!didInstallFactory) {
                    if (factoryToInstall === moduleFactoryFn) {
                        applyModuleFactoryName(moduleFactoryFn);
                    }
                    didInstallFactory = true;
                }
                moduleFactories.set(id, factoryToInstall);
                newModuleId?.(id);
            }
        }
        i = end + 1; // end is pointing at the last factory advance to the next id or the end of the array.
    }
}
/**
 * A pseudo "fake" URL object to resolve to its relative path.
 *
 * When UrlRewriteBehavior is set to relative, calls to the `new URL()` will construct url without base using this
 * runtime function to generate context-agnostic urls between different rendering context, i.e ssr / client to avoid
 * hydration mismatch.
 *
 * This is based on webpack's existing implementation:
 * https://github.com/webpack/webpack/blob/87660921808566ef3b8796f8df61bd79fc026108/lib/runtime/RelativeUrlRuntimeModule.js
 */ const relativeURL = function relativeURL(inputUrl) {
    const realUrl = new URL(inputUrl, 'x:/');
    const values = {};
    for(const key in realUrl)values[key] = realUrl[key];
    values.href = inputUrl;
    values.pathname = inputUrl.replace(/[?#].*/, '');
    values.origin = values.protocol = '';
    values.toString = values.toJSON = (..._args)=>inputUrl;
    for(const key in values)Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        value: values[key]
    });
};
relativeURL.prototype = URL.prototype;
contextPrototype.U = relativeURL;
/**
 * Utility function to ensure all variants of an enum are handled.
 */ function invariant(never, computeMessage) {
    throw new Error(`Invariant: ${computeMessage(never)}`);
}
/**
 * Constructs an error message for when a module factory is not available.
 */ function factoryNotAvailableMessage(moduleId, sourceType, sourceData) {
    let instantiationReason;
    switch(sourceType){
        case 0:
            instantiationReason = `as a runtime entry of chunk ${sourceData}`;
            break;
        case 1:
            instantiationReason = `because it was required from module ${sourceData}`;
            break;
        case 2:
            instantiationReason = 'because of an HMR update';
            break;
        default:
            invariant(sourceType, (sourceType)=>`Unknown source type: ${sourceType}`);
    }
    return `Module ${moduleId} was instantiated ${instantiationReason}, but the module factory is not available.`;
}
/**
 * A stub function to make `require` available but non-functional in ESM.
 */ function requireStub(_moduleId) {
    throw new Error('dynamic usage of require is not supported');
}
contextPrototype.z = requireStub;
// Make `globalThis` available to the module in a way that cannot be shadowed by a local variable.
contextPrototype.g = globalThis;
function applyModuleFactoryName(factory) {
    // Give the module factory a nice name to improve stack traces.
    Object.defineProperty(factory, 'name', {
        value: 'module evaluation'
    });
}
/// <reference path="./runtime-types.d.ts" />
/// <reference path="./runtime-utils.ts" />
/**
 * Top-level-await / async-module machinery. This is only included in the runtime
 * when the module graph actually contains an async module (a module with
 * top-level await, or one that transitively depends on one). When no async
 * module is present, the chunk items never reference `__turbopack_context__.a`,
 * so this whole file can be omitted.
 *
 * everything below is adapted from webpack
 * https://github.com/webpack/webpack/blob/6be4065ade1e252c1d8dcba4af0f43e32af1bdc1/lib/runtime/AsyncModuleRuntimeModule.js#L13
 */ const turbopackQueues = Symbol('turbopack queues');
const turbopackExports = Symbol('turbopack exports');
const turbopackError = Symbol('turbopack error');
function isPromise(maybePromise) {
    return maybePromise != null && typeof maybePromise === 'object' && 'then' in maybePromise && typeof maybePromise.then === 'function';
}
function isAsyncModuleExt(obj) {
    return turbopackQueues in obj;
}
function createPromise() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej)=>{
        reject = rej;
        resolve = res;
    });
    return {
        promise,
        resolve: resolve,
        reject: reject
    };
}
function resolveQueue(queue) {
    if (queue && queue.status !== 1) {
        queue.status = 1;
        queue.forEach((fn)=>fn.queueCount--);
        queue.forEach((fn)=>fn.queueCount-- ? fn.queueCount++ : fn());
    }
}
function wrapDeps(deps) {
    return deps.map((dep)=>{
        if (dep !== null && typeof dep === 'object') {
            if (isAsyncModuleExt(dep)) return dep;
            if (isPromise(dep)) {
                const queue = Object.assign([], {
                    status: 0
                });
                const obj = {
                    [turbopackExports]: {},
                    [turbopackQueues]: (fn)=>fn(queue)
                };
                dep.then((res)=>{
                    obj[turbopackExports] = res;
                    resolveQueue(queue);
                }, (err)=>{
                    obj[turbopackError] = err;
                    resolveQueue(queue);
                });
                return obj;
            }
        }
        return {
            [turbopackExports]: dep,
            [turbopackQueues]: ()=>{}
        };
    });
}
function asyncModule(body, hasAwait) {
    const module = this.m;
    const queue = hasAwait ? Object.assign([], {
        status: -1
    }) : undefined;
    const depQueues = new Set();
    const { resolve, reject, promise: rawPromise } = createPromise();
    const promise = Object.assign(rawPromise, {
        [turbopackExports]: module.exports,
        [turbopackQueues]: (fn)=>{
            queue && fn(queue);
            depQueues.forEach(fn);
            promise['catch'](()=>{});
        }
    });
    const attributes = {
        get () {
            return promise;
        },
        set (v) {
            // Calling `esmExport` leads to this.
            if (v !== promise) {
                promise[turbopackExports] = v;
            }
        }
    };
    Object.defineProperty(module, 'exports', attributes);
    Object.defineProperty(module, 'namespaceObject', attributes);
    function handleAsyncDependencies(deps) {
        const currentDeps = wrapDeps(deps);
        const getResult = ()=>currentDeps.map((d)=>{
                if (d[turbopackError]) throw d[turbopackError];
                return d[turbopackExports];
            });
        const { promise, resolve } = createPromise();
        const fn = Object.assign(()=>resolve(getResult), {
            queueCount: 0
        });
        function fnQueue(q) {
            if (q !== queue && !depQueues.has(q)) {
                depQueues.add(q);
                if (q && q.status === 0) {
                    fn.queueCount++;
                    q.push(fn);
                }
            }
        }
        currentDeps.map((dep)=>dep[turbopackQueues](fnQueue));
        return fn.queueCount ? promise : getResult();
    }
    function asyncResult(err) {
        if (err) {
            reject(promise[turbopackError] = err);
        } else {
            resolve(promise[turbopackExports]);
        }
        resolveQueue(queue);
    }
    body(handleAsyncDependencies, asyncResult);
    if (queue && queue.status === -1) {
        queue.status = 0;
    }
}
contextPrototype.a = asyncModule;
/// <reference path="../shared/runtime/runtime-utils.ts" />
/// A 'base' utilities to support runtime can have externals.
/// Currently this is for node.js / edge runtime both.
/// If a fn requires node.js specific behavior, it should be placed in `node-external-utils` instead.
async function externalImport(id) {
    let raw;
    try {
        switch (id) {
  case "next/dist/compiled/@vercel/og/index.node.js":
    raw = await import("next/dist/compiled/@vercel/og/index.edge.js");
    break;
  case "pg-587764f78a6c7a9c":
    raw = await import("pg-587764f78a6c7a9c");
    break;
  default:
    raw = await import(id);
};
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (raw && raw.__esModule && raw.default && 'default' in raw.default) {
        return interopEsm(raw.default, createNS(raw), true);
    }
    return raw;
}
contextPrototype.y = externalImport;
function externalRequire(id, thunk, esm = false) {
    let raw;
    try {
        raw = thunk();
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (!esm || raw.__esModule) {
        return raw;
    }
    return interopEsm(raw, createNS(raw), true);
}
externalRequire.resolve = (id, options)=>{
    return require.resolve(id, options);
};
contextPrototype.x = externalRequire;
/* eslint-disable @typescript-eslint/no-unused-vars */ const path = require('path');
const relativePathToRuntimeRoot = path.relative(RUNTIME_PUBLIC_PATH, '.');
// Compute the relative path to the `distDir`.
const relativePathToDistRoot = path.join(relativePathToRuntimeRoot, RELATIVE_ROOT_PATH);
const RUNTIME_ROOT = path.resolve(__filename, relativePathToRuntimeRoot);
// Compute the absolute path to the root, by stripping distDir from the absolute path to this file.
const ABSOLUTE_ROOT = path.resolve(__filename, relativePathToDistRoot);
/**
 * Returns an absolute path to the given module path.
 * Module path should be relative, either path to a file or a directory.
 *
 * This fn allows to calculate an absolute path for some global static values, such as
 * `__dirname` or `import.meta.url` that Turbopack will not embeds in compile time.
 * See ImportMetaBinding::code_generation for the usage.
 */ function resolveAbsolutePath(modulePath) {
    if (modulePath) {
        return path.join(ABSOLUTE_ROOT, modulePath);
    }
    return ABSOLUTE_ROOT;
}
Context.prototype.P = resolveAbsolutePath;
/**
 * Returns an absolute `file://` URL for the given module path.
 *
 * Uses `url.pathToFileURL` so that the resulting URL is a valid file URI on
 * all platforms (forward slashes on Windows, drive letters handled
 * correctly, path segments URL-encoded).
 */ function resolveFileUrl(modulePath) {
    return require('url').pathToFileURL(resolveAbsolutePath(modulePath)).href;
}
Context.prototype.F = resolveFileUrl;
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../../shared/runtime/runtime-utils.ts" />
/// <reference path="../../shared-node/base-externals-utils.ts" />
/// <reference path="../../shared-node/node-externals-utils.ts" />
/// <reference path="./nodejs-globals.d.ts" />
/**
 * Base Node.js runtime shared between production and development.
 * Contains chunk loading, module caching, and other non-HMR functionality.
 */ process.env.TURBOPACK = '1';
const url = require('url');
const moduleFactories = new Map();
const moduleCache = Object.create(null);
/**
 * Returns an absolute path to the given module's id.
 */ function resolvePathFromModule(moduleId) {
    const exported = this.r(moduleId);
    const exportedPath = exported?.default ?? exported;
    if (typeof exportedPath !== 'string') {
        return exported;
    }
    const strippedAssetPrefix = exportedPath.slice(ASSET_PREFIX.length);
    const resolved = path.resolve(RUNTIME_ROOT, strippedAssetPrefix);
    return url.pathToFileURL(resolved).href;
}
/**
 * Exports a URL value. No suffix is added in Node.js runtime.
 */ function exportUrl(urlValue, id) {
    exportValue.call(this, urlValue, id);
}
function loadRuntimeChunk(sourcePath, chunkData) {
    if (typeof chunkData === 'string') {
        loadRuntimeChunkPath(sourcePath, chunkData);
    } else {
        loadRuntimeChunkPath(sourcePath, chunkData.path);
    }
}
const loadedChunks = new Set();
const unsupportedLoadChunk = Promise.resolve(undefined);
const loadedChunk = Promise.resolve(undefined);
const chunkCache = new Map();
function clearChunkCache() {
    chunkCache.clear();
    loadedChunks.clear();
}
function loadRuntimeChunkPath(sourcePath, chunkPath) {
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return;
    }
    if (loadedChunks.has(chunkPath)) {
        return;
    }
    try {
        const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
        const chunkModules = requireChunk(chunkPath);
        installCompressedModuleFactories(chunkModules, 0, moduleFactories);
        loadedChunks.add(chunkPath);
    } catch (cause) {
        let errorMessage = `Failed to load chunk ${chunkPath}`;
        if (sourcePath) {
            errorMessage += ` from runtime for chunk ${sourcePath}`;
        }
        const error = new Error(errorMessage, {
            cause
        });
        error.name = 'ChunkLoadError';
        throw error;
    }
}
function loadChunkAsync(chunkData) {
    const chunkPath = typeof chunkData === 'string' ? chunkData : chunkData.path;
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return unsupportedLoadChunk;
    }
    let entry = chunkCache.get(chunkPath);
    if (entry === undefined) {
        try {
            // resolve to an absolute path to simplify `require` handling
            const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
            // TODO: consider switching to `import()` to enable concurrent chunk loading and async file io
            // However this is incompatible with hot reloading (since `import` doesn't use the require cache)
            const chunkModules = requireChunk(chunkPath);
            installCompressedModuleFactories(chunkModules, 0, moduleFactories);
            entry = loadedChunk;
        } catch (cause) {
            const errorMessage = `Failed to load chunk ${chunkPath} from module ${this.m.id}`;
            const error = new Error(errorMessage, {
                cause
            });
            error.name = 'ChunkLoadError';
            // Cache the failure promise, future requests will also get this same rejection
            entry = Promise.reject(error);
        }
        chunkCache.set(chunkPath, entry);
    }
    // TODO: Return an instrumented Promise that React can use instead of relying on referential equality.
    return entry;
}
contextPrototype.l = loadChunkAsync;
function loadChunkAsyncByUrl(chunkUrl) {
    const path1 = url.fileURLToPath(new URL(chunkUrl, RUNTIME_ROOT));
    return loadChunkAsync.call(this, path1);
}
contextPrototype.L = loadChunkAsyncByUrl;
// Shared runtime primitive: the root that on-disk chunk paths are resolved
// against. Used by the bundled wasm helper (exposed as `__turbopack_runtime_root__`).
contextPrototype.w = RUNTIME_ROOT;
const regexJsUrl = /\.js(?:\?[^#]*)?(?:#.*)?$/;
/**
 * Checks if a given path/URL ends with .js, optionally followed by ?query or #fragment.
 */ function isJs(chunkUrlOrPath) {
    return regexJsUrl.test(chunkUrlOrPath);
}
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-base.ts" />
/**
 * Production Node.js runtime.
 * Uses ModuleWithDirection and simple module instantiation without HMR support.
 */ // moduleCache and moduleFactories are declared in runtime-base.ts
// this is read in runtime-utils.ts so it creates a module with direction for hmr
createModuleWithDirectionFlag = true;
const nodeContextPrototype = Context.prototype;
nodeContextPrototype.q = exportUrl;
nodeContextPrototype.M = moduleFactories;
// Cast moduleCache to ModuleWithDirection for production mode
nodeContextPrototype.c = moduleCache;
nodeContextPrototype.R = resolvePathFromModule;
nodeContextPrototype.C = clearChunkCache;
function instantiateModule(id, sourceType, sourceData) {
    const moduleFactory = moduleFactories.get(id);
    if (typeof moduleFactory !== 'function') {
        // This can happen if modules incorrectly handle HMR disposes/updates,
        // e.g. when they keep a `setTimeout` around which still executes old code
        // and contains e.g. a `require("something")` call.
        throw new Error(factoryNotAvailableMessage(id, sourceType, sourceData));
    }
    const module1 = createModuleWithDirection(id);
    const exports = module1.exports;
    moduleCache[id] = module1;
    const context = new Context(module1, exports);
    // NOTE(alexkirsz) This can fail when the module encounters a runtime error.
    try {
        moduleFactory(context, module1, exports);
    } catch (error) {
        module1.error = error;
        throw error;
    }
    ;
    module1.loaded = true;
    if (module1.namespaceObject && module1.exports !== module1.namespaceObject) {
        // in case of a circular dependency: cjs1 -> esm2 -> cjs1
        interopEsm(module1.exports, module1.namespaceObject);
    }
    return module1;
}
/**
 * Retrieves a module from the cache, or instantiate it if it is not cached.
 */ // @ts-ignore
function getOrInstantiateModuleFromParent(id, sourceModule) {
    const module1 = moduleCache[id];
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateModule(id, SourceType.Parent, sourceModule.id);
}
/**
 * Instantiates a runtime module.
 */ function instantiateRuntimeModule(chunkPath, moduleId) {
    return instantiateModule(moduleId, SourceType.Runtime, chunkPath);
}
/**
 * Retrieves a module from the cache, or instantiate it as a runtime module if it is not cached.
 */ // @ts-ignore TypeScript doesn't separate this module space from the browser runtime
function getOrInstantiateRuntimeModule(chunkPath, moduleId) {
    const module1 = moduleCache[moduleId];
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateRuntimeModule(chunkPath, moduleId);
}
module.exports = (sourcePath)=>({
        m: (id)=>getOrInstantiateRuntimeModule(sourcePath, id),
        c: (chunkData)=>loadRuntimeChunk(sourcePath, chunkData)
    });


//# sourceMappingURL=%5Bturbopack%5D_runtime.js.map

  function requireChunk(chunkPath) {
    switch(chunkPath) {
      case "server/chunks/ssr/[root-of-the-server]__03fokgg._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__03fokgg._.js");
      case "server/chunks/ssr/[root-of-the-server]__0r8qfu0._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0r8qfu0._.js");
      case "server/chunks/ssr/[root-of-the-server]__10ppemx._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__10ppemx._.js");
      case "server/chunks/ssr/[root-of-the-server]__1zdq1pc._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1zdq1pc._.js");
      case "server/chunks/ssr/[turbopack]_runtime.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[turbopack]_runtime.js");
      case "server/chunks/ssr/_19w8ehr._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_19w8ehr._.js");
      case "server/chunks/ssr/_next-internal_server_app__not-found_page_actions_0pt47yr.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__not-found_page_actions_0pt47yr.js");
      case "server/chunks/ssr/node_modules_next_dist_1n3w9lb._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_1n3w9lb._.js");
      case "server/chunks/ssr/node_modules_next_dist_1vz8kh1._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_1vz8kh1._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_0wpq8j3._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_0wpq8j3._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_1bi5-b2._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_1bi5-b2._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_forbidden_0symwr9.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_forbidden_0symwr9.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_0l_sp0x.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_0l_sp0x.js");
      case "server/chunks/ssr/[root-of-the-server]__1ds5dja._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1ds5dja._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_dashboard_page_actions_1fa04hu.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_dashboard_page_actions_1fa04hu.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_0q-w892.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_0q-w892.js");
      case "server/chunks/ssr/node_modules_react-icons_fi_index_mjs_0cqav6z._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_react-icons_fi_index_mjs_0cqav6z._.js");
      case "server/chunks/ssr/src_app_admin_dashboard_page_tsx_0-0qwyi._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_dashboard_page_tsx_0-0qwyi._.js");
      case "server/chunks/ssr/[root-of-the-server]__0-si4xs._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0-si4xs._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_dashboard_reports_page_actions_1gzffuo.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_dashboard_reports_page_actions_1gzffuo.js");
      case "server/chunks/ssr/src_app_admin_dashboard_reports_page_tsx_075-mvw._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_dashboard_reports_page_tsx_075-mvw._.js");
      case "server/chunks/ssr/[root-of-the-server]__0cshspz._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0cshspz._.js");
      case "server/chunks/ssr/_1845gy-._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_1845gy-._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_users_page_actions_1j4t7lq.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_users_page_actions_1j4t7lq.js");
      case "server/chunks/[root-of-the-server]__0l3yhx4._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0l3yhx4._.js");
      case "server/chunks/[root-of-the-server]__1_q48zy._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1_q48zy._.js");
      case "server/chunks/[root-of-the-server]__1b4dpwo._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1b4dpwo._.js");
      case "server/chunks/[turbopack]_runtime.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[turbopack]_runtime.js");
      case "server/chunks/_next-internal_server_app_api_admin_classes_route_actions_1v8dij-.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_classes_route_actions_1v8dij-.js");
      case "server/chunks/node_modules_next_1_14bcs._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/node_modules_next_1_14bcs._.js");
      case "server/chunks/src_lib_auth_ts_1_aqh19._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/src_lib_auth_ts_1_aqh19._.js");
      case "server/chunks/[root-of-the-server]__0f5ap7u._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0f5ap7u._.js");
      case "server/chunks/_next-internal_server_app_api_admin_classes_[id]_route_actions_0y8flgi.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_classes_[id]_route_actions_0y8flgi.js");
      case "server/chunks/[externals]__0fc-3y7._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[externals]__0fc-3y7._.js");
      case "server/chunks/_087lp95._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_087lp95._.js");
      case "server/chunks/_next-internal_server_app_api_admin_reports_export_route_actions_212wcyv.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_reports_export_route_actions_212wcyv.js");
      case "server/chunks/[root-of-the-server]__15si_yu._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__15si_yu._.js");
      case "server/chunks/_next-internal_server_app_api_admin_school-settings_route_actions_11h4wi6.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_school-settings_route_actions_11h4wi6.js");
      case "server/chunks/[root-of-the-server]__0b79r0m._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0b79r0m._.js");
      case "server/chunks/_next-internal_server_app_api_admin_students_accounts_route_actions_1b08ykl.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_students_accounts_route_actions_1b08ykl.js");
      case "server/chunks/node_modules_bcryptjs_index_0k82xso.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/node_modules_bcryptjs_index_0k82xso.js");
      case "server/chunks/[root-of-the-server]__0tf9_sh._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0tf9_sh._.js");
      case "server/chunks/_next-internal_server_app_api_admin_students_invites_route_actions_1h3_f_e.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_students_invites_route_actions_1h3_f_e.js");
      case "server/chunks/[root-of-the-server]__0xorh17._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0xorh17._.js");
      case "server/chunks/_1q-_r9l._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_1q-_r9l._.js");
      case "server/chunks/_next-internal_server_app_api_admin_students_route_actions_185rxx3.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_students_route_actions_185rxx3.js");
      case "server/chunks/1oeh_server_app_api_admin_students_[id]_reset-account_route_actions_1qruvok.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_students_[id]_reset-account_route_actions_1qruvok.js");
      case "server/chunks/[root-of-the-server]__131b8g2._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__131b8g2._.js");
      case "server/chunks/[root-of-the-server]__10hxq7e._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__10hxq7e._.js");
      case "server/chunks/_0t5st_p._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_0t5st_p._.js");
      case "server/chunks/_next-internal_server_app_api_admin_students_[id]_route_actions_0v0lzxa.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_students_[id]_route_actions_0v0lzxa.js");
      case "server/chunks/[root-of-the-server]__1pyi3a8._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1pyi3a8._.js");
      case "server/chunks/_next-internal_server_app_api_admin_users_route_actions_0q-rtz1.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_users_route_actions_0q-rtz1.js");
      case "server/chunks/[root-of-the-server]__0b_xx_w._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0b_xx_w._.js");
      case "server/chunks/_0z0zrlu._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_0z0zrlu._.js");
      case "server/chunks/_next-internal_server_app_api_admin_users_[id]_route_actions_1hhpuc4.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_users_[id]_route_actions_1hhpuc4.js");
      case "server/chunks/[externals]__0l8ei7u._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[externals]__0l8ei7u._.js");
      case "server/chunks/_07fz-vx._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_07fz-vx._.js");
      case "server/chunks/_next-internal_server_app_api_announcements_route_actions_1rbylj6.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_announcements_route_actions_1rbylj6.js");
      case "server/chunks/[root-of-the-server]__05844i7._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__05844i7._.js");
      case "server/chunks/_1yx71lu._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_1yx71lu._.js");
      case "server/chunks/_next-internal_server_app_api_attendance_route_actions_1whc13v.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_attendance_route_actions_1whc13v.js");
      case "server/chunks/[root-of-the-server]__0p32k31._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0p32k31._.js");
      case "server/chunks/_1gijqv8._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_1gijqv8._.js");
      case "server/chunks/_next-internal_server_app_api_attendance_scan_route_actions_0bvclbq.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_attendance_scan_route_actions_0bvclbq.js");
      case "server/chunks/[root-of-the-server]__0wl-nr0._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0wl-nr0._.js");
      case "server/chunks/_024ufpc._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_024ufpc._.js");
      case "server/chunks/_next-internal_server_app_api_auth_change-password_route_actions_0dcnj10.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_auth_change-password_route_actions_0dcnj10.js");
      case "server/chunks/[root-of-the-server]__0wtsd-6._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0wtsd-6._.js");
      case "server/chunks/_next-internal_server_app_api_auth_forgot-password_route_actions_1eh5g41.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_auth_forgot-password_route_actions_1eh5g41.js");
      case "server/chunks/[root-of-the-server]__0ad8ffy._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0ad8ffy._.js");
      case "server/chunks/_1h0t5we._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_1h0t5we._.js");
      case "server/chunks/_next-internal_server_app_api_auth_login_route_actions_1ox7zi0.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_auth_login_route_actions_1ox7zi0.js");
      case "server/chunks/[root-of-the-server]__0djj9-7._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0djj9-7._.js");
      case "server/chunks/_next-internal_server_app_api_auth_logout_route_actions_0regwyr.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_auth_logout_route_actions_0regwyr.js");
      case "server/chunks/[root-of-the-server]__04bheeb._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__04bheeb._.js");
      case "server/chunks/_next-internal_server_app_api_auth_me_route_actions_17uv6xh.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_auth_me_route_actions_17uv6xh.js");
      case "server/chunks/[root-of-the-server]__0xmi-58._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0xmi-58._.js");
      case "server/chunks/_next-internal_server_app_api_auth_register-parent_check_route_actions_0blo_iv.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_auth_register-parent_check_route_actions_0blo_iv.js");
      case "server/chunks/[root-of-the-server]__12f1me8._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__12f1me8._.js");
      case "server/chunks/_0ucrfm4._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_0ucrfm4._.js");
      case "server/chunks/_next-internal_server_app_api_auth_register-parent_route_actions_072-p93.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_auth_register-parent_route_actions_072-p93.js");
      case "server/chunks/[root-of-the-server]__02ij_ow._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__02ij_ow._.js");
      case "server/chunks/_next-internal_server_app_api_auth_reset-password_route_actions_0ym3n2y.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_auth_reset-password_route_actions_0ym3n2y.js");
      case "server/chunks/[root-of-the-server]__1_-1278._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1_-1278._.js");
      case "server/chunks/_15y1fk_._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_15y1fk_._.js");
      case "server/chunks/_next-internal_server_app_api_leave_route_actions_15dig3h.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_leave_route_actions_15dig3h.js");
      case "server/chunks/[root-of-the-server]__0tdp5fp._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0tdp5fp._.js");
      case "server/chunks/_next-internal_server_app_api_leave_[id]_attachment_route_actions_1w8452w.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_leave_[id]_attachment_route_actions_1w8452w.js");
      case "server/chunks/[root-of-the-server]__1pxe3vt._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1pxe3vt._.js");
      case "server/chunks/_next-internal_server_app_api_leave_[id]_route_actions_0p_p9g4.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_leave_[id]_route_actions_0p_p9g4.js");
      case "server/chunks/[root-of-the-server]__171kmui._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__171kmui._.js");
      case "server/chunks/_next-internal_server_app_api_owner_activity_route_actions_01xolab.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_owner_activity_route_actions_01xolab.js");
      case "server/chunks/[root-of-the-server]__0n4-7m8._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0n4-7m8._.js");
      case "server/chunks/_0l9ib4x._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_0l9ib4x._.js");
      case "server/chunks/_next-internal_server_app_api_owner_schools_route_actions_060en5k.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_owner_schools_route_actions_060en5k.js");
      case "server/chunks/[root-of-the-server]__15q7nqy._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__15q7nqy._.js");
      case "server/chunks/_next-internal_server_app_api_owner_schools_[id]_payments_route_actions_1g8ussx.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_owner_schools_[id]_payments_route_actions_1g8ussx.js");
      case "server/chunks/1oeh_server_app_api_owner_schools_[id]_reset-admin_route_actions_1lz6cpu.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_owner_schools_[id]_reset-admin_route_actions_1lz6cpu.js");
      case "server/chunks/[root-of-the-server]__08xd5m7._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__08xd5m7._.js");
      case "server/chunks/[root-of-the-server]__1gvtw39._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1gvtw39._.js");
      case "server/chunks/_0l2942r._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_0l2942r._.js");
      case "server/chunks/_next-internal_server_app_api_owner_schools_[id]_route_actions_0cig5ez.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_owner_schools_[id]_route_actions_0cig5ez.js");
      case "server/chunks/[root-of-the-server]__0m8q4nb._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0m8q4nb._.js");
      case "server/chunks/_next-internal_server_app_api_parent_children_route_actions_0ovz3n-.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_parent_children_route_actions_0ovz3n-.js");
      case "server/chunks/[root-of-the-server]__18l0xjp._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__18l0xjp._.js");
      case "server/chunks/_next-internal_server_app_api_parent_link-child_route_actions_064zcaj.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_parent_link-child_route_actions_064zcaj.js");
      case "server/chunks/_1szi3b1._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_1szi3b1._.js");
      case "server/chunks/_next-internal_server_app_api_principal_overview_route_actions_1tn9mch.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_principal_overview_route_actions_1tn9mch.js");
      case "server/chunks/[root-of-the-server]__0b4_cdn._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0b4_cdn._.js");
      case "server/chunks/_next-internal_server_app_api_student_me_route_actions_0rzajwu.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_student_me_route_actions_0rzajwu.js");
      case "server/chunks/[root-of-the-server]__0azym7r._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0azym7r._.js");
      case "server/chunks/_next-internal_server_app_api_student_qr_route_actions_07oly2h.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_student_qr_route_actions_07oly2h.js");
      case "server/chunks/[root-of-the-server]__03zxzj_._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__03zxzj_._.js");
      case "server/chunks/_next-internal_server_app_api_students_route_actions_0bn8g80.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_students_route_actions_0bn8g80.js");
      case "server/chunks/_0mol7ox._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_0mol7ox._.js");
      case "server/chunks/_next-internal_server_app_api_teacher_attendance_route_actions_0sf_b4l.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_teacher_attendance_route_actions_0sf_b4l.js");
      case "server/chunks/[root-of-the-server]__1hkse1v._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1hkse1v._.js");
      case "server/chunks/_next-internal_server_app_api_teacher_today_route_actions_020u_55.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_teacher_today_route_actions_020u_55.js");
      case "server/chunks/ssr/[root-of-the-server]__1y9r5v0._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1y9r5v0._.js");
      case "server/chunks/ssr/_1260zxq._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_1260zxq._.js");
      case "server/chunks/ssr/_next-internal_server_app_change-password_page_actions_0r2ginr.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_change-password_page_actions_0r2ginr.js");
      case "server/chunks/ssr/[root-of-the-server]__0ht7a4k._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0ht7a4k._.js");
      case "server/chunks/ssr/_next-internal_server_app_dashboard_students_page_actions_0nya09m.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_dashboard_students_page_actions_0nya09m.js");
      case "server/chunks/ssr/src_app_dashboard_students_page_tsx_1-fhnh3._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_dashboard_students_page_tsx_1-fhnh3._.js");
      case "server/chunks/ssr/[root-of-the-server]__0s64s9u._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0s64s9u._.js");
      case "server/chunks/ssr/_0qgcj4_._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_0qgcj4_._.js");
      case "server/chunks/ssr/_next-internal_server_app_login_page_actions_04fnjo0.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_login_page_actions_04fnjo0.js");
      case "server/chunks/ssr/node_modules_next_1v1tkgs._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_1v1tkgs._.js");
      case "server/chunks/ssr/[root-of-the-server]__0u995ci._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0u995ci._.js");
      case "server/chunks/ssr/_next-internal_server_app_owner_dashboard_page_actions_1c87w3t.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_owner_dashboard_page_actions_1c87w3t.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_1s88ev4._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_1s88ev4._.js");
      case "server/chunks/ssr/src_app_owner_dashboard_page_tsx_06fn401._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_owner_dashboard_page_tsx_06fn401._.js");
      case "server/chunks/ssr/[root-of-the-server]__01p0g54._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__01p0g54._.js");
      case "server/chunks/ssr/_090pcqb._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_090pcqb._.js");
      case "server/chunks/ssr/_1s18577._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_1s18577._.js");
      case "server/chunks/ssr/_next-internal_server_app_page_actions_0hhsz1j.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_page_actions_0hhsz1j.js");
      case "server/chunks/ssr/[root-of-the-server]__06o3ybi._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__06o3ybi._.js");
      case "server/chunks/ssr/_1r2az91._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_1r2az91._.js");
      case "server/chunks/ssr/_next-internal_server_app_parent_dashboard_page_actions_1eg6wm3.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_parent_dashboard_page_actions_1eg6wm3.js");
      case "server/chunks/ssr/src_app_parent_dashboard_page_tsx_11eiwam._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_parent_dashboard_page_tsx_11eiwam._.js");
      case "server/chunks/ssr/[root-of-the-server]__0dmi0cb._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0dmi0cb._.js");
      case "server/chunks/ssr/_0akdchu._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_0akdchu._.js");
      case "server/chunks/ssr/_next-internal_server_app_principal_dashboard_page_actions_0c7jqix.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_principal_dashboard_page_actions_0c7jqix.js");
      case "server/chunks/ssr/[root-of-the-server]__083xe5w._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__083xe5w._.js");
      case "server/chunks/ssr/_0jxor9a._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_0jxor9a._.js");
      case "server/chunks/ssr/_next-internal_server_app_register_page_actions_1op-s-x.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_register_page_actions_1op-s-x.js");
      case "server/chunks/[root-of-the-server]__10zp9vq._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__10zp9vq._.js");
      case "server/chunks/_next-internal_server_app_robots_txt_route_actions_15vc_89.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_robots_txt_route_actions_15vc_89.js");
      case "server/chunks/ssr/[root-of-the-server]__092l57c._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__092l57c._.js");
      case "server/chunks/ssr/_1i6hez7._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_1i6hez7._.js");
      case "server/chunks/ssr/_next-internal_server_app_scan_page_actions_0tps3fz.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_scan_page_actions_0tps3fz.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_1fk4h60._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_1fk4h60._.js");
      case "server/chunks/[root-of-the-server]__0z-whjb._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0z-whjb._.js");
      case "server/chunks/_next-internal_server_app_sitemap_xml_route_actions_05l5km9.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_sitemap_xml_route_actions_05l5km9.js");
      case "server/chunks/ssr/[root-of-the-server]__0k-m6e-._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0k-m6e-._.js");
      case "server/chunks/ssr/[root-of-the-server]__0xd-qi-._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0xd-qi-._.js");
      case "server/chunks/ssr/[root-of-the-server]__1_qy4ky._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1_qy4ky._.js");
      case "server/chunks/ssr/_next-internal_server_app_student_dashboard_page_actions_1elw_zl.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_student_dashboard_page_actions_1elw_zl.js");
      case "server/chunks/ssr/[root-of-the-server]__1pmu86i._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1pmu86i._.js");
      case "server/chunks/ssr/_next-internal_server_app_teacher_dashboard_page_actions_0reirq2.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_teacher_dashboard_page_actions_0reirq2.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0d52jpy._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0d52jpy._.js");
      case "server/chunks/ssr/src_app_teacher_dashboard_page_tsx_14t84tl._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_teacher_dashboard_page_tsx_14t84tl._.js");
      case "server/chunks/ssr/[root-of-the-server]__1_-jk6-._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1_-jk6-._.js");
      case "server/chunks/ssr/[root-of-the-server]__1io3bae._.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1io3bae._.js");
      case "server/chunks/ssr/_next-internal_server_app__global-error_page_actions_0zi5s8-.js": return require("D:/hadirku - Copy/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__global-error_page_actions_0zi5s8-.js");
      default:
        throw new Error(`Not found ${chunkPath}`);
    }
  }


  async function loadWasmChunk(chunkPath) {
    switch (chunkPath) {

      default:
        throw new Error(`Unknown wasm chunk: ${chunkPath}`);
    }
  }
