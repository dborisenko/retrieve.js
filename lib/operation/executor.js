var Retrieve;
(function (Retrieve) {
    var AsyncOperationExecutor = (function () {
        function AsyncOperationExecutor(operation, settings) {
            this.operation = operation;
            this.settings = settings;
            this.beforeSignal = new Retrieve.Signal();
            this.completeSignal = new Retrieve.Signal();
            this.settingsList = [];
            this.inProgress = false;
            this.timeout = 10000;
            this.addSettings(settings, false);
        }
        AsyncOperationExecutor.prototype.addSettings = function (settings, withCallback) {
            if (typeof withCallback === "undefined") { withCallback = true; }
            this.settingsList = this.settingsList || [];
            if(settings && this.settingsList.indexOf(settings) == -1) {
                this.settingsList.push(settings);
                if(withCallback && this.inProgress) {
                    this.callBefore(settings);
                }
            }
        };
        AsyncOperationExecutor.prototype.removeSettings = function (settings, withCallback) {
            if (typeof withCallback === "undefined") { withCallback = true; }
            if(settings && this.settingsList) {
                var index = this.settingsList.indexOf(settings);
                if(index != -1) {
                    this.settingsList.splice(index, 1);
                }
                if(this.inProgress) {
                    if(withCallback) {
                        this.callComplete(settings, null, Retrieve.CompleteStatus.abort);
                    }
                    if(this.settingsList.length == 0) {
                        this.abort();
                    }
                }
            }
        };
        AsyncOperationExecutor.prototype.execute = function () {
            if(!this.inProgress) {
                this.onBefore();
                this.executeOperation();
            }
        };
        AsyncOperationExecutor.prototype.abort = function () {
            if(this.inProgress) {
                this.onComplete(null, Retrieve.CompleteStatus.abort);
                this.abortOperation();
            }
        };
        AsyncOperationExecutor.prototype.initOperation = function () {
            if(this.operation) {
                this.operation.settings = this.settings;
                if(this.operation.completeSignal) {
                    this.operation.completeSignal.add(this.onComplete, this);
                }
            }
        };
        AsyncOperationExecutor.prototype.disposeOperation = function () {
            if(this.operation && this.operation.completeSignal) {
                this.operation.completeSignal.remove(this.onComplete, this);
            }
        };
        AsyncOperationExecutor.prototype.abortOperation = function () {
            if(this.operation && typeof this.operation.abort === "function") {
                this.operation.abort();
            }
        };
        AsyncOperationExecutor.prototype.executeOperation = function () {
            if(this.operation && typeof this.operation.execute === "function") {
                this.operation.execute();
            }
        };
        AsyncOperationExecutor.prototype.initTimeout = function () {
            var _this = this;
            this.disposeTimeout();
            if(this.timeout > 0) {
                this.timeoutId = setTimeout(function () {
                    _this.onTimeout();
                }, this.timeout);
            }
        };
        AsyncOperationExecutor.prototype.disposeTimeout = function () {
            if(this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = undefined;
            }
        };
        AsyncOperationExecutor.prototype.onTimeout = function () {
            if(this.inProgress) {
                this.onComplete(null, Retrieve.CompleteStatus.timeout);
                this.abortOperation();
            }
            this.disposeTimeout();
        };
        AsyncOperationExecutor.prototype.onBefore = function () {
            var _this = this;
            this.callForEach(this.settingsList, function (settings) {
                _this.callBefore(settings);
            });
            if(this.beforeSignal) {
                this.beforeSignal.trigger();
            }
            this.inProgress = true;
            this.initOperation();
            this.initTimeout();
        };
        AsyncOperationExecutor.prototype.onComplete = function (data, status) {
            var _this = this;
            this.disposeOperation();
            this.disposeTimeout();
            this.inProgress = false;
            this.callForEach(this.settingsList, function (settings) {
                _this.callComplete(settings, data, status);
            });
            if(this.completeSignal) {
                this.completeSignal.trigger(data, status);
            }
        };
        AsyncOperationExecutor.prototype.callForEach = function (settingsList, callback) {
            if(settingsList && typeof callback === "function") {
                for(var i = 0; i < settingsList.length; i++) {
                    var settings = settingsList[i];
                    if(settings) {
                        callback.apply(this, [
                            settings
                        ]);
                    }
                }
            }
        };
        AsyncOperationExecutor.prototype.callBefore = function (settings) {
            if(settings && typeof settings.before === "function") {
                settings.before();
            }
        };
        AsyncOperationExecutor.prototype.callComplete = function (settings, data, status) {
            if(settings) {
                if(status == Retrieve.CompleteStatus.success && typeof settings.success === "function") {
                    settings.success(data);
                } else if(status == Retrieve.CompleteStatus.error && typeof settings.error === "function") {
                    settings.error(data);
                }
                if(typeof settings.complete === "function") {
                    settings.complete(data, status);
                }
            }
        };
        return AsyncOperationExecutor;
    })();
    Retrieve.AsyncOperationExecutor = AsyncOperationExecutor;    
})(Retrieve || (Retrieve = {}));
//@ sourceMappingURL=executor.js.map
