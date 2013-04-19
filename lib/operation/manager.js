var Retrieve;
(function (Retrieve) {
    var AsyncOperationWrapper = (function () {
        function AsyncOperationWrapper(settings, executor) {
            this.settings = settings;
            this.executor = executor;
            this.completeSignal = new Retrieve.Signal();
        }
        AsyncOperationWrapper.prototype.execute = function () {
            if(this.settings && this.executor) {
                if(this.executor.completeSignal) {
                    this.executor.completeSignal.add(this.onExecutorComplete, this);
                }
                this.executor.addSettings(this.settings);
                this.executor.execute();
            }
        };
        AsyncOperationWrapper.prototype.abort = function () {
            if(this.settings && this.executor) {
                this.executor.removeSettings(this.settings);
                if(this.executor.completeSignal) {
                    this.executor.completeSignal.remove(this.onExecutorComplete, this);
                }
            }
        };
        AsyncOperationWrapper.prototype.onExecutorComplete = function (data, status) {
            if(this.completeSignal) {
                this.completeSignal.trigger(data, status);
            }
        };
        return AsyncOperationWrapper;
    })();
    Retrieve.AsyncOperationWrapper = AsyncOperationWrapper;    
    var AsyncOperationManager = (function () {
        function AsyncOperationManager(createOperationFunction) {
            this.createOperationFunction = createOperationFunction;
            this.beforeSignal = new Retrieve.Signal();
            this.completeSignal = new Retrieve.Signal();
            this.operationsInProgress = [];
            this.settingsList = [];
        }
        AsyncOperationManager.prototype.addSettings = function (settings) {
            this.settingsList = this.settingsList || [];
            if(settings) {
                if(this.settingsList.indexOf(settings) == -1) {
                    this.settingsList.push(settings);
                }
                if(this.currentExecutor) {
                    this.currentExecutor.addSettings(settings);
                }
            }
        };
        AsyncOperationManager.prototype.removeSettings = function (settings) {
            if(settings) {
                if(this.settingsList) {
                    var index = this.settingsList.indexOf(settings);
                    if(index != -1) {
                        this.settingsList.splice(index, 1);
                    }
                }
                if(this.currentExecutor) {
                    this.currentExecutor.removeSettings(settings);
                }
            }
        };
        AsyncOperationManager.prototype.hasSettings = function (settings) {
            return settings && this.settingsList && this.settingsList.indexOf(settings) != -1;
        };
        AsyncOperationManager.prototype.isInProgress = function () {
            return !!(this.currentExecutor);
        };
        AsyncOperationManager.prototype.settingsListCount = function () {
            return this.settingsList ? this.settingsList.length : 0;
        };
        AsyncOperationManager.prototype.execute = function (settings) {
            if (typeof settings === "undefined") { settings = null; }
            var _this = this;
            if(!this.currentExecutor) {
                this.currentExecutor = this.createExecutor(this.createOperationFunction(settings), settings);
            }
            var operation = new AsyncOperationWrapper(settings, this.currentExecutor);
            this.operationsInProgress.push(operation);
            if(operation.completeSignal) {
                var onComplete = function (data, status) {
                    operation.completeSignal.remove(onComplete, _this);
                    var index = _this.operationsInProgress.indexOf(operation);
                    if(index >= 0) {
                        _this.operationsInProgress.splice(index, 1);
                    }
                };
                operation.completeSignal.add(onComplete, this);
            }
            operation.execute();
            return operation;
        };
        AsyncOperationManager.prototype.createExecutor = function (operation, settings) {
            var _this = this;
            if(this.beforeSignal) {
                this.beforeSignal.trigger();
            }
            var executor = new Retrieve.AsyncOperationExecutor(operation, settings);
            for(var i = 0; i < this.settingsList.length; i++) {
                var settings = this.settingsList[i];
                if(settings) {
                    executor.addSettings(settings);
                }
            }
            if(executor.completeSignal) {
                var onComplete = function (data, status) {
                    executor.completeSignal.remove(onComplete, _this);
                    _this.currentExecutor = null;
                    if(_this.completeSignal) {
                        _this.completeSignal.trigger(data, status);
                    }
                };
                executor.completeSignal.add(onComplete, this);
            }
            return executor;
        };
        return AsyncOperationManager;
    })();
    Retrieve.AsyncOperationManager = AsyncOperationManager;    
})(Retrieve || (Retrieve = {}));
//@ sourceMappingURL=manager.js.map
