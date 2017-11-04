(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var event_throttle_1 = require("./package-src/event-throttle");
var EventThrottleTest = (function () {
    function EventThrottleTest() {
        var _this = this;
        this.attr = null;
        this.textArea = document.getElementById("textArea");
        this.charCountEl = document.getElementById("char-count");
        this.wordCountEl = document.getElementById("word-count");
        this.statsThrottle = new event_throttle_1.EventThrottle(function (s, e) { _this.onUpdateStats(s, e); }, { throttleDuration: 500 });
        this.formatThrottle = new event_throttle_1.EventThrottle(function (s, e) { _this.onFormat(s, e); }, { throttleDuration: 1500, suppressActive: true });
        this.textArea.addEventListener("keydown", function (e) { _this.onKeyDown(); });
        this.textArea.addEventListener("keyup", function (e) { _this.statsThrottle.registerEvent(e); _this.formatThrottle.registerEvent(e); });
        this.textArea.focus();
    }
    EventThrottleTest.prototype.addEventListener = function (eventName, handler) {
        var elementIds = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            elementIds[_i - 2] = arguments[_i];
        }
        for (var _a = 0, elementIds_1 = elementIds; _a < elementIds_1.length; _a++) {
            var id = elementIds_1[_a];
            var el = document.getElementById(id);
            el.addEventListener(eventName, handler);
        }
    };
    EventThrottleTest.prototype.onUpdateStats = function (sender, sourceEvent) {
        var s = this.textArea.value;
        this.wordCountEl.innerHTML = this.countWords(s).toString();
        this.charCountEl.innerHTML = s.length.toString();
    };
    EventThrottleTest.prototype.countWords = function (s) {
        s = s.replace(/(^\s*)|(\s*$)/gi, "");
        s = s.replace(/\t|\r|\n/gi, " ");
        s = s.replace(/[ ]{2,}/gi, " ");
        s = s.replace(/\n /, "\n");
        return s.length > 0 ? s.split(" ").length : 0;
    };
    EventThrottleTest.prototype.onKeyDown = function () {
        if (!this.attr) {
            this.attr = this.textArea.attributes.removeNamedItem("_idle");
        }
    };
    EventThrottleTest.prototype.onFormat = function (sender, sourceEvent) {
        this.textArea.attributes.setNamedItem(this.attr);
        this.attr = null;
    };
    return EventThrottleTest;
}());
exports.EventThrottleTest = EventThrottleTest;
var _test;
window.onload = function () {
    _test = new EventThrottleTest();
};

},{"./package-src/event-throttle":2}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A helper class that throttles events streaming from a specific event source.
 */
var EventThrottle = (function () {
    /**
     * Creates a new instance of the @type {EventThrottle} class.
     * @param callbackFunction - the function for handling throttled downstream events.
     * @param options - Optional configuration values in the form of an object implementing @type {EventThrottleOptions}.
     */
    function EventThrottle(callbackFunction, options) {
        /** @internal */
        this._throtDur = 150;
        /** @internal */
        this._suppressActive = false;
        /** @internal */
        this._backlog = 0;
        /** @internal */
        this._enabled = true;
        /** @internal */
        this._last = null;
        /** @internal */
        this._lastState = null;
        if (!callbackFunction)
            throw new Error("EventThrottle: callbackFunction cannot be null.");
        if (options) {
            if (typeof (options.throttleDuration) == "number" && options.throttleDuration >= 0)
                this._throtDur = options.throttleDuration;
            this._suppressActive = options.suppressActive;
        }
        this._fn = callbackFunction;
    }
    Object.defineProperty(EventThrottle.prototype, "throttled", {
        /**
         * Gets the number of source events that have been suppressed since the last downstream event was dispatched by this instance.
         */
        get: function () {
            return this._backlog;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EventThrottle.prototype, "isThrottling", {
        /**
         * Returns true if 1 or more source events have been suppressed since the last downstream event was dispatched by this instance.
         */
        get: function () {
            return this._backlog > 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EventThrottle.prototype, "enabled", {
        /**
         * Gets or sets the enabled state of the EventThrottle instance. Setting enabled to 'false' will automatically flush the EventThrottle.
         */
        get: function () {
            return this._enabled;
        },
        set: function (value) {
            this._enabled = value;
            if (!value)
                this.flush();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Flushes any suppressed source events that have not yet been processed.
     */
    EventThrottle.prototype.flush = function () {
        this._backlog = 0;
        this._last = null;
    };
    /**
     * Registers an upstream source event to be potentially queued for downstream processing.
     * @param sourceEvent - The source Event.
     * @param state - Optional state to be passed to the downstream event handler.
     */
    EventThrottle.prototype.registerEvent = function (e, state) {
        if (this._fn === null || !this._enabled)
            return;
        if (this._throtDur == 0) {
            this._backlog = 1;
            this.processEvent(1, e, state);
            this._backlog = 0;
        }
        else {
            this._last = e;
            this._lastState = state;
            if (++this._backlog == 1)
                this.queueEvent(e, state);
        }
    };
    /** @internal */
    EventThrottle.prototype.queueEvent = function (e, state) {
        var _this = this;
        setTimeout(function (backlog) {
            _this.processEvent(backlog, e, state);
        }, this._throtDur, this._backlog);
    };
    /** @internal */
    EventThrottle.prototype.processEvent = function (backlog, e, state) {
        // Return if disabled or if the backlog has otherwise been cleared by an invocation of flush() since the timeout was queued.
        if (this._backlog == 0)
            return;
        this._backlog -= backlog;
        if (!this._suppressActive || this._backlog == 0)
            this._fn(this, e, state);
        // If there have been events since the timeout was queued, queue another to ensure a downstream event always fires on the final source event.
        if (this._backlog > 0) {
            this.queueEvent(this._last, this._lastState);
            this._last = null;
            this._lastState = null;
        }
    };
    return EventThrottle;
}());
exports.EventThrottle = EventThrottle;

},{}]},{},[1]);
