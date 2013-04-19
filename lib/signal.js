var Retrieve;
(function (Retrieve) {
    var Signal = (function () {
        function Signal() { }
        Signal.prototype.add = function (callback, context) {
            this.callbacks || (this.callbacks = []);
            if(this.getCallbackIndex(callback, context) == -1) {
                this.callbacks.push({
                    callback: callback,
                    context: context
                });
            }
        };
        Signal.prototype.remove = function (callback, context) {
            var index = this.getCallbackIndex(callback, context);
            if(index >= 0) {
                this.callbacks.splice(index, 1);
            }
        };
        Signal.prototype.trigger = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            if(this.callbacks) {
                for(var i = 0; i < this.callbacks.length; i++) {
                    var item = this.callbacks[i];
                    if(item && typeof item.callback === "function") {
                        item.callback.apply(item.context || this, args);
                    }
                }
            }
        };
        Signal.prototype.getCallbackIndex = function (callback, context) {
            if(this.callbacks && (callback || context)) {
                for(var i = 0; i < this.callbacks.length; i++) {
                    var item = this.callbacks[i];
                    if(item && (!callback || item.callback === callback) && (!context || item.context === context)) {
                        return i;
                    }
                }
            }
            return -1;
        };
        return Signal;
    })();
    Retrieve.Signal = Signal;    
})(Retrieve || (Retrieve = {}));
//@ sourceMappingURL=signal.js.map
