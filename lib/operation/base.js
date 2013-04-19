var Retrieve;
(function (Retrieve) {
    Retrieve.CompleteStatus = {
        success: "success",
        error: "error",
        timeout: "timeout",
        abort: "abort"
    };
    var AsyncOperationBase = (function () {
        function AsyncOperationBase() {
            this.completeSignal = new Retrieve.Signal();
        }
        AsyncOperationBase.prototype.complete = function (data, status) {
            if(this.completeSignal) {
                this.completeSignal.trigger(data, status);
            }
        };
        AsyncOperationBase.prototype.abort = function () {
        };
        AsyncOperationBase.prototype.execute = function () {
        };
        return AsyncOperationBase;
    })();
    Retrieve.AsyncOperationBase = AsyncOperationBase;    
})(Retrieve || (Retrieve = {}));
//@ sourceMappingURL=base.js.map
