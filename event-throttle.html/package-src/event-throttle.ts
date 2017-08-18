/**
 * The callback function that is invoked by an EventThrottle instance to dispatch a throttled upstream event to a downstream handler.
 * @param sender The EventThrottle that dispatched the event.
 * @param sourceEvent The source  event.
 * @param state Optional state to be passed to the downstream event handler.
 */
export type EventThrottleCallbackFunction = (sender: EventThrottle, sourceEvent?: any, state?: any) => void;

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
export class EventThrottle {
    /** @internal */
    private _fn: EventThrottleCallbackFunction;
    /** @internal */
    private _throtDur: number = 150;
    /** @internal */
    private _suppressActive: boolean = false;
    /** @internal */
    private _backlog: number = 0;
    /** @internal */
    private _enabled: boolean = true;
    /** @internal */
    private _last: any = null;
    /** @internal */
    private _lastState: any = null;

    /**
     * Creates a new instance of the EventThrottle class.
     * @param callbackFunction - the function for handling throttled downstream events.
     * @param options - Optional configuration values in the form of an object implementing EventThrottleOptions.
     */
    constructor(callbackFunction: EventThrottleCallbackFunction, options?: EventThrottleOptions) {
        if (!callbackFunction) throw new Error("EventThrottle: callbackFunction cannot be null.");

        if (options) {
            if (typeof (options.throttleDuration) == "number" && options.throttleDuration >= 0) this._throtDur = options.throttleDuration;
            this._suppressActive = options.suppressActive;
        }

        this._fn = callbackFunction;
    }

    /**
     * Gets the number of source events that have been suppressed since the last downstream event was dispatched by this instance.
     */
    public get throttled(): number {
        return this._backlog;
    }

    /**
     * Returns true if 1 or more source events have been suppressed since the last downstream event was dispatched by this instance.
     */
    public get isThrottling(): boolean {
        return this._backlog > 0;
    }

    /**
     * Gets or sets the enabled state of the EventThrottle instance. Setting enabled to 'false' will automatically flush the EventThrottle.
     */
    public get enabled(): boolean {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        this._enabled = value;
        if (!value)
            this.flush();
    }

    /**
     * Flushes any suppressed source events that have not yet been processed.
     */
    public flush(): void {
        this._backlog = 0;
        this._last = null;
    }

    /**
     * Registers an upstream source event to be potentially queued for downstream processing.
     * @param sourceEvent - The source Event.
     * @param state - Optional state to be passed to the downstream event handler.
     */
    public registerEvent(e?: any, state?: any) {
        if (this._fn === null || !this._enabled) return;

        if (this._throtDur == 0) {
            this._backlog = 1;
            this.processEvent(1, e, state)
            this._backlog = 0;
        }
        else {
            this._last = e;
            this._lastState = state;
            if (++this._backlog == 1)
                this.queueEvent(e, state);
        }
    }

    /** @internal */
    private queueEvent(e: any, state: any) {
        setTimeout((backlog: number) => {
            this.processEvent(backlog, e, state);
        }, this._throtDur, this._backlog);
    }

    /** @internal */
    private processEvent(backlog: number, e: any, state: any) {
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
    }
}