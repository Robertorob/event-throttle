/**
 * @function EventThrottleCallbackFunction
 * @param sender - The @type {EventThrottle} that dispatched the event.
 * @param sourceEvent - The source  @type {Event}.
 */
export type EventThrottleCallbackFunction = (sender: EventThrottle, sourceEvent: Event) => void;

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
    private _last: Event = null;

    /**
     * @constructor - Creates a new instance of the @type {EventThrottle} class.
     * @param callbackFunction - the function for handling throttled downstream events.
     * @param options - Optional configuration values in the form of an object implementing @type {EventThrottleOptions}.
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
     * @property throttled - Gets the number of source events that have been suppressed since the last downstream event was dispatched by this instance.
     */
    public get throttled(): number {
        return this._backlog;
    }

    /**
     * @property enabled - Returns true if 1 or more source events have been suppressed since the last downstream event was dispatched by this instance.
     */
    public get isThrottling(): boolean {
        return this._backlog > 0;
    }

    /**
     * @property enabled - Gets or sets the enabled state of the @type {EventThrottle} instance.
     * Setting enabled to 'false' will automatically flush the @type {EventThrottle} instance.
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
     * @function flush - Flushes any suppressed source events that have not yet been processed.
     */
    public flush(): void {
        this._backlog = 0;
        this._last = null;
    }

    /**
     * @function registerEvent - Registers an upstream source event to be potentially queued for downstream processing.
     */
    public registerEvent(e?: Event) {
        if (this._fn === null || !this._enabled) return;

        if (this._throtDur == 0) {
            this._backlog = 1;
            this.processEvent(1, e)
            this._backlog = 0;
        }
        else {
            this._last = e;
            if (++this._backlog == 1)
                this.queueEvent(e);
        }
    }

    /** @internal */
    private queueEvent(e: Event) {
        setTimeout((backlog: number) => {
            this.processEvent(backlog, e);
        }, this._throtDur, this._backlog);
    }

    /** @internal */
    private processEvent(backlog: number, e: Event) {
        // Return if disabled or if the backlog has otherwise been cleared by an invocation of flush() since the timeout was queued.
        if (this._backlog == 0)
            return;

        this._backlog -= backlog;
        if (!this._suppressActive || this._backlog == 0)
            this._fn(this, e);

        // If there have been events since the timeout was queued, queue another to ensure a downstream event always fires on the final source event.
        if (this._backlog > 0) {
            this.queueEvent(this._last);
            this._last = null;
        }
    }
}