module Retrieve
{
    interface SignalCallbackItem {
        callback:(...args:any[]) => void;
        context?:any;
    }

    export class Signal {
        private callbacks:SignalCallbackItem[];

        add(callback:(...args:any[]) => void, context?:any) {
            this.callbacks || (this.callbacks = []);
            if (this.getCallbackIndex(callback, context) == -1)
                this.callbacks.push({callback: callback, context: context});
        }

        remove(callback:(...args:any[]) => void, context?:any) {
            var index:number = this.getCallbackIndex(callback, context);
            if (index >= 0)
                this.callbacks.splice(index, 1);
        }

        trigger(...args:any[]) {
            if (this.callbacks) {
                for (var i:number = 0; i < this.callbacks.length; i++) {
                    var item:SignalCallbackItem = this.callbacks[i];
                    if (item && typeof item.callback === "function")
                        item.callback.apply(item.context || this, args);
                }
            }
        }

        private getCallbackIndex(callback:(...args:any[]) => void, context?:any):number {
            if (this.callbacks && (callback || context)) {
                for (var i:number = 0; i < this.callbacks.length; i++) {
                    var item:SignalCallbackItem = this.callbacks[i];
                    if (item && (!callback || item.callback === callback) && (!context || item.context === context))
                        return i;
                }
            }
            return -1;
        }
    }
}
