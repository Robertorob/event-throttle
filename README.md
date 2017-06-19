# @brycemarshall/event-throttle

A helper class that throttles events streaming from a specific event source.

EventThrottle can be used to decrease the "density" of events from any upstream event source and therefore reduce the processing burden on attached downstream event handlers, 
OR to guanrantee that a downstream event is raised to handle ONLY the LAST in each sequence of upstream source events.

A sequence is defined as any series of events with no more than a throttle duration interval between each sequential event.

Conceptually, EventSource can be be loosely considered to "slow down" events from an upstream event source, although in practise it actually ensures that downstream events are 
dispatched to EventThrottle clients with a maximum frequency (the throttle duration, specified in milliseconds). It does this by dispatching only one upstream event
per throttle duration period whilst also guaranteeing that the last event in each upstream sequence will ALWAYS be dispatched to the downstream handler.

# Demo

http://plnkr.co/nC6ter

## Installation

`npm install @brycemarshall/event-throttle`

#The module exports the following types:

```ts

/**
 * @function EventThrottleCallbackFunction
 * @param sender - The @type {EventThrottle} that dispatched the event.
 * @param sourceEvent - The source  @type {Event}.
 */
export declare type EventThrottleCallbackFunction = (sender: EventThrottle, sourceEvent: Event) => void;
/**
 * Specifies EventThrottle configuration options.
 * @interface EventThrottleOptions
 * @property {number} throttleDuration - When specified, defines the duration (in milliseconds) of the minimum delay in between
    processing downstream events (the default is 150 milliseconds).
 * @property {boolean} suppressActive - If true, results in only the last of a sequence of upstream (source) events being fired.
 * In practise, this means that the @type {EventThrottle} instance wil only dispatch a throttled event if no additional upstream events
 * were raised after the active event was queued for processing.
 */
export interface EventThrottleOptions {
    throttleDuration?: number;
    suppressActive?: boolean;
}
export declare class EventThrottle {
    /**
     * @constructor - Creates a new instance of the @type {EventThrottle} class.
     * @param callbackFunction - the function for handling throttled downstream events.
     * @param options - Optional configuration values in the form of an object implementing @type {EventThrottleOptions}.
     */    
    constructor(callbackFunction: EventThrottleCallbackFunction, options?: EventThrottleOptions);
    /**
     * @property throttled - Gets the number of source events that have been suppressed since the last downstream event was dispatched by this instance.
     */
    readonly throttled: number;
    /**
     * @property enabled - Returns true if 1 or more source events have been suppressed since the last downstream event was dispatched by this instance.
     */
    readonly isThrottling: boolean;
    /**
     * @property enabled - Gets or sets the enabled state of the @type {EventThrottle} instance.
     * Setting enabled to 'false' will automatically flush the @type {EventThrottle} instance.
     */
    enabled: boolean;
    /**
     * @function flush - Flushes any suppressed source events that have not yet been processed.
     */
    flush(): void;
    /**
     * @function registerEvent - Registers an upstream source event to be potentially queued for downstream processing.
     */
    registerEvent(e?: Event): void;
}


```
# Usage - General

EventThrottle instances are created by invoking the EventThrottle constructor and passing (at a minimum) a callback function to be invoked in response to scroll events.
Further configuration is possible by passing an object implementing EventThrottleOptions.

# Usage - Default Configuration

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

# Usage - Custom Throttle Duration

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

# Usage - Supress Active (Last Event in Sequence Only)

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
