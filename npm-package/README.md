# @brycemarshall/event-throttle

A helper class that throttles events streaming from a specific event source.

EventThrottle can be used to decrease the "density" of events from any upstream event source and therefore reduce the processing burden on attached downstream event handlers, 
OR to guanrantee that a downstream event is raised to handle ONLY the LAST in each sequence of upstream source events.

A sequence is defined as any series of events with no more than a throttle duration interval between each sequential event.

Conceptually, EventThrottle can be be loosely considered to "slow down" events from an upstream event source, although in practise it actually ensures that downstream events are 
dispatched to EventThrottle clients with a maximum frequency (the throttle duration, specified in milliseconds). It does this by dispatching only one upstream event
per throttle duration period whilst also guaranteeing that the last event in each upstream sequence will ALWAYS be dispatched to the downstream handler.

## Demo

http://plnkr.co/nC6ter

## Installation

`npm install @brycemarshall/event-throttle`

##The module exports the following types:

```ts
/**
 * The callback function that is invoked by an EventThrottle instance to dispatch a throttled upstream event to a downstream handler.
 * @param sender The EventThrottle that dispatched the event.
 * @param sourceEvent The source  event.
 * @param state Optional state to be passed to the downstream event handler.
 */
export declare type EventThrottleCallbackFunction = (sender: EventThrottle, sourceEvent?: any, state?: any) => void;
/**
 * Specifies EventThrottle configuration options.
 */
export interface EventThrottleOptions {
    /**
     * When specified, defines the duration (in milliseconds) of the minimum delay in between processing downstream events (the default is 150 milliseconds).
     */
    throttleDuration?: number;
    /**
     * Specifies EventThrottle configuration options.
     * If true, results in only the last of a sequence of upstream (source) events being fired.
     * In practise, this means that the EventThrottle instance wil only dispatch a throttled event if no additional upstream events
     * were raised after the active event was queued for processing.
     */
    suppressActive?: boolean;
}
/**
 * A helper class that throttles events streaming from a specific event source.
 * EventThrottle can be used to decrease the "density" of events from any upstream event source and therefore reduce the processing burden on attached downstream event handlers,
 * OR to guanrantee that a downstream event is raised to handle ONLY the LAST in each sequence of upstream source events.
 *
 * A sequence is defined as any series of events with no more than a throttle duration interval between each sequential event.
 *
 * Remarks:
 *
 * Conceptually, EventThrottle can be be loosely considered to "slow down" events from an upstream event source, although in practise it actually ensures that downstream events are
 * dispatched to EventThrottle clients with a maximum frequency (the throttle duration, specified in milliseconds). It does this by dispatching only one upstream event
 * per throttle duration period whilst also guaranteeing that the last event in each upstream sequence will ALWAYS be dispatched to the downstream handler.
 */
export declare class EventThrottle {
    /** @internal */
    private _fn;
    /** @internal */
    private _throtDur;
    /** @internal */
    private _suppressActive;
    /** @internal */
    private _backlog;
    /** @internal */
    private _enabled;
    /** @internal */
    private _last;
    /** @internal */
    private _lastState;
    /**
     * Creates a new instance of the EventThrottle class.
     * @param callbackFunction - the function for handling throttled downstream events.
     * @param options - Optional configuration values in the form of an object implementing EventThrottleOptions.
     */
    constructor(callbackFunction: EventThrottleCallbackFunction, options?: EventThrottleOptions);
    /**
     * Gets the number of source events that have been suppressed since the last downstream event was dispatched by this instance.
     */
    readonly throttled: number;
    /**
     * Returns true if 1 or more source events have been suppressed since the last downstream event was dispatched by this instance.
     */
    readonly isThrottling: boolean;
    /**
     * Gets or sets the enabled state of the EventThrottle instance. Setting enabled to 'false' will automatically flush the EventThrottle.
     */
    enabled: boolean;
    /**
     * Flushes any suppressed source events that have not yet been processed.
     */
    flush(): void;
    /**
     * Registers an upstream source event to be potentially queued for downstream processing.
     * @param sourceEvent - The source Event.
     * @param state - Optional state to be passed to the downstream event handler.
     */
    registerEvent(e?: any, state?: any): void;
    /** @internal */
    private queueEvent(e, state);
    /** @internal */
    private processEvent(backlog, e, state);
}
```
## Usage - General

EventThrottle instances are created by invoking the EventThrottle constructor and passing (at a minimum) a callback function to be invoked in response to scroll events.
Further configuration is possible by passing an object implementing EventThrottleOptions.

## Usage - Default Configuration

An example of throttling an upstream event source using the default configuration.

```ts
class EventThrottleDefault
{
    private throttle: EventThrottle;

    constructor() {
        this.throttle = new EventThrottle((s, e) => { this.onDownstreamEvent(s, e) });
        document.getElementById("sourceElement").addEventListener("keydown", (e) => { this.throttle.registerEvent(e); });
    }
    
    onDownstreamEvent (sender: EventThrottleOptions, sourceEvent: Event) {
        console.log("Downstream event fired.");
    }
}

```

## Usage - Passing State

An example of passing state to the downstream event handler.

```ts
class EventThrottleState
{
    private throttle: EventThrottle;
    private _state = "My State";

    constructor() {
        this.throttle = new EventThrottle((source, evt, state) => { this.onDownstreamEvent(source, evt, state) });
        document.getElementById("sourceElement").addEventListener("keydown", (evt) => { this.throttle.registerEvent(evt, this._state); });
    }
    
    onDownstreamEvent (sender: EventThrottleOptions, sourceEvent: Event, state: string) {
        console.log("Downstream event fired - state = '" + state + "'");
    }
}

```

## Usage - Custom Throttle Duration

An example of throttling an upstream event source using a custom throttle duration of 300ms.

```ts
class EventThrottleCustomDuration
{
    private throttle: EventThrottle;

    constructor() {
        this.throttle = new EventThrottle(target, (s, e) => { this.onDownstreamEvent(s, e) }, { throttleDuration: 300 });
        document.getElementById("sourceElement").addEventListener("keydown", (e) => { this.throttle.registerEvent(e); });
    }
    
    onDownstreamEvent (sender: EventThrottleOptions, sourceEvent: Event) {
        console.log("Downstream event fired.");
    }
}

```

## Usage - Suppress Active (Last Event in Sequence Only)

An example of throttling an upstream event source to ensure that ONLY the last event in any upstream sequence is dispatched to the downstream handler.
In this example, a sequence is defined as any series of events with no more than a 1500ms interval between sequential events.

```ts
class EventThrottleSupressActive
{
    private throttle: EventThrottle;

    constructor() {
        this.throttle = new EventThrottle(target, (s, e) => { this.onDownstreamEvent(s, e) }, { throttleDuration: 1500, suppressActive: true });
        document.getElementById("sourceElement").addEventListener("keydown", (e) => { this.throttle.registerEvent(e); });
    }
    
    onDownstreamEvent (sender: EventThrottleOptions, sourceEvent: Event) {
        console.log("Downstream event fired.");
    }
}

```

## Contributors

 - Bryce Marshall

## MIT Licenced
