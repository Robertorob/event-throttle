import { EventThrottle, EventThrottleOptions } from './package-src/event-throttle';

export class EventThrottleTest {
    private textArea: HTMLTextAreaElement;
    private statsThrottle: EventThrottle;
    private formatThrottle: EventThrottle;
    private charCountEl: HTMLElement;
    private wordCountEl: HTMLElement;
    private attr: Attr = null;

    constructor() {
        this.textArea = <HTMLTextAreaElement>document.getElementById("textArea");
        this.charCountEl = document.getElementById("char-count");
        this.wordCountEl = document.getElementById("word-count");
        this.statsThrottle = new EventThrottle((s, e) => { this.onUpdateStats(s, e) }, { throttleDuration: 500 });
        this.formatThrottle = new EventThrottle((s, e) => { this.onFormat(s, e) }, { throttleDuration: 1500, suppressActive: true });

        this.textArea.addEventListener("keydown", (e) => { this.onKeyDown(); });
        this.textArea.addEventListener("keyup", (e) => { this.statsThrottle.registerEvent(e); this.formatThrottle.registerEvent(e); });
        this.textArea.focus();
    }

    private addEventListener(eventName: string, handler: EventListener, ...elementIds: string[]) {
        for (let id of elementIds) {
            let el = document.getElementById(id);
            el.addEventListener(eventName, handler);
        }
    }

    onUpdateStats(sender: EventThrottle, sourceEvent: Event) {
        let s = this.textArea.value;
        this.wordCountEl.innerHTML = this.countWords(s).toString();
        this.charCountEl.innerHTML = s.length.toString();
    }

    countWords(s: string): number {
        s = s.replace(/(^\s*)|(\s*$)/gi, "");
        s = s.replace(/\t|\r|\n/gi, " ");
        s = s.replace(/[ ]{2,}/gi, " ");
        s = s.replace(/\n /, "\n");
        
        return s.length > 0 ?  s.split(" ").length : 0;
    }

    onKeyDown(){
        if (!this.attr){
            this.attr = this.textArea.attributes.removeNamedItem("_idle");
        }
    }
    
    onFormat(sender: EventThrottle, sourceEvent: Event) {
        this.textArea.attributes.setNamedItem(this.attr);
        this.attr = null;
    }
}

var _test;
window.onload = function () {
    _test = new EventThrottleTest();
}

