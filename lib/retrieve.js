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
var Retrieve;
(function (Retrieve) {
    var OperationsRepository = (function () {
        function OperationsRepository() {
            this.dictionary = {
            };
        }
        OperationsRepository.prototype.add = function (type, createOperationFunction, settings) {
            if (typeof settings === "undefined") { settings = null; }
            if(this.dictionary && type && createOperationFunction) {
                var item = {
                    type: type,
                    createOperationFunction: createOperationFunction
                };
                if(settings) {
                    item.settings = settings;
                }
                this.dictionary[type] = item;
            }
        };
        OperationsRepository.prototype.remove = function (type) {
            if(this.dictionary && type) {
                delete this.dictionary[type];
            }
        };
        OperationsRepository.prototype.getItem = function (type) {
            var item;
            if(this.dictionary && type) {
                item = this.dictionary[type];
            }
            return item;
        };
        OperationsRepository.prototype.getCreateMethod = function (type) {
            var result;
            var item = this.getItem(type);
            if(item && typeof item.createOperationFunction === "function") {
                result = item.createOperationFunction;
            }
            return result;
        };
        return OperationsRepository;
    })();
    Retrieve.OperationsRepository = OperationsRepository;    
})(Retrieve || (Retrieve = {}));
var Retrieve;
(function (Retrieve) {
    var OperationsManager = (function () {
        function OperationsManager(repository) {
            this.repository = repository;
            this.managers = {
            };
        }
        OperationsManager.prototype.getManager = function (settings, createNewManager) {
            if (typeof createNewManager === "undefined") { createNewManager = true; }
            var hash = this.hash(settings);
            var manager = this.managers[hash];
            if(!manager && createNewManager) {
                manager = new Retrieve.AsyncOperationManager(this.repository.getCreateMethod(settings.type));
                this.managers[hash] = manager;
            }
            return manager;
        };
        OperationsManager.prototype.addSettings = function (settings) {
            var manager = this.getManager(settings, true);
            if(manager) {
                manager.addSettings(settings);
            }
        };
        OperationsManager.prototype.hasSettings = function (settings) {
            var manager = this.getManager(settings, false);
            return settings && manager && manager.hasSettings(settings);
        };
        OperationsManager.prototype.removeSettings = function (settings) {
            var manager = this.getManager(settings, false);
            if(manager) {
                manager.removeSettings(settings);
            }
            this.cleanupManager(settings, manager);
        };
        OperationsManager.prototype.execute = function (settings) {
            var result;
            var manager = this.getManager(settings, false);
            if(manager) {
                result = manager.execute(settings);
            }
            return result;
        };
        OperationsManager.prototype.hash = function (settings) {
            var result;
            if(settings) {
                var type = "";
                if(typeof settings.type !== "undefined") {
                    type = settings.type;
                }
                var data = "";
                if(typeof settings.data !== "undefined") {
                    data = JSON.stringify(settings.data);
                }
                if(type && type !== "" && data && data !== "") {
                    result = type + "/" + data;
                }
            }
            return result;
        };
        OperationsManager.prototype.cleanupManager = function (settings, manager) {
            if (typeof manager === "undefined") { manager = null; }
            if(!manager) {
                manager = this.getManager(settings, false);
            }
            if(manager && !manager.isInProgress() && manager.settingsListCount() === 0) {
                var hash = this.hash(settings);
                delete this.managers[hash];
            }
        };
        return OperationsManager;
    })();
    Retrieve.OperationsManager = OperationsManager;    
})(Retrieve || (Retrieve = {}));
var Retrieve;
(function (Retrieve) {
    var RetrieveOperationManager = (function () {
        function RetrieveOperationManager(manager) {
            this.manager = manager;
            this.settingsList = [];
        }
        RetrieveOperationManager.prototype.prepareSettings = function (typeOrSettings, settings) {
            settings = settings || (typeof typeOrSettings === "object" ? typeOrSettings : undefined) || {
            };
            if(!settings.type && typeof typeOrSettings === "string") {
                settings.type = typeOrSettings;
            }
            return settings;
        };
        RetrieveOperationManager.prototype.addSettings = function (typeOrSettings, settings) {
            this.settingsList = this.settingsList || [];
            settings = this.prepareSettings(typeOrSettings, settings);
            if(settings) {
                if(this.settingsList.indexOf(settings) == -1) {
                    this.settingsList.push(settings);
                }
                if(this.manager) {
                    this.manager.addSettings(settings);
                }
            }
        };
        RetrieveOperationManager.prototype.removeSettings = function (typeOrSettings, settings) {
            settings = this.prepareSettings(typeOrSettings, settings);
            if(settings) {
                if(this.settingsList) {
                    var index = this.settingsList.indexOf(settings);
                    if(index != -1) {
                        this.settingsList.splice(index, 1);
                    }
                }
                if(this.manager) {
                    this.manager.removeSettings(settings);
                }
            }
        };
        RetrieveOperationManager.prototype.removeAllSettings = function () {
            if(this.settingsList) {
                var toRemove = this.settingsList.slice(0);
                for(var i = 0; i < toRemove.length; i++) {
                    this.removeSettings(toRemove[i]);
                }
            }
        };
        RetrieveOperationManager.prototype.execute = function (typeOrSettings, settings) {
            settings = this.prepareSettings(typeOrSettings, settings);
            return this.manager.execute(settings);
        };
        RetrieveOperationManager.prototype.configure = function (typeOrSettings, settings) {
            this.addSettings(typeOrSettings, settings);
        };
        RetrieveOperationManager.prototype.retrieve = function (typeOrSettings, settings) {
            return this.execute(typeOrSettings, settings);
        };
        RetrieveOperationManager.prototype.dispose = function () {
            this.removeAllSettings();
        };
        return RetrieveOperationManager;
    })();    
    Retrieve.repository = new Retrieve.OperationsRepository();
    Retrieve.manager = new Retrieve.OperationsManager(Retrieve.repository);
    function retriever() {
        return new RetrieveOperationManager(Retrieve.manager);
    }
    Retrieve.retriever = retriever;
})(Retrieve || (Retrieve = {}));
