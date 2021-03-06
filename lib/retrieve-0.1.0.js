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
    var AsyncSettingsBase = (function () {
        function AsyncSettingsBase() {
            this.beforeSignal = new Retrieve.Signal();
            this.completeSignal = new Retrieve.Signal();
        }
        AsyncSettingsBase.prototype.complete = function (data, status) {
            if(this.completeSignal) {
                this.completeSignal.trigger(data, status);
            }
        };
        AsyncSettingsBase.prototype.before = function () {
            if(this.beforeSignal) {
                this.beforeSignal.trigger();
            }
        };
        return AsyncSettingsBase;
    })();
    Retrieve.AsyncSettingsBase = AsyncSettingsBase;    
    var AsyncOperationBase = (function () {
        function AsyncOperationBase() {
            this.beforeSignal = new Retrieve.Signal();
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
    var AsyncInvokerBase = (function () {
        function AsyncInvokerBase() {
            this.settingsList = [];
        }
        AsyncInvokerBase.prototype.addSettings = function (settings) {
            this.settingsList = this.settingsList || [];
            if(settings && !this.hasSettings(settings)) {
                this.settingsList.push(settings);
            }
        };
        AsyncInvokerBase.prototype.removeSettings = function (settings) {
            if(settings) {
                if(this.settingsList) {
                    var index = this.settingsList.indexOf(settings);
                    if(index != -1) {
                        this.settingsList.splice(index, 1);
                    }
                }
            }
        };
        AsyncInvokerBase.prototype.hasSettings = function (settings) {
            return settings && this.settingsList && this.settingsList.indexOf(settings) != -1;
        };
        AsyncInvokerBase.prototype.settingsListCount = function () {
            return this.settingsList ? this.settingsList.length : 0;
        };
        AsyncInvokerBase.prototype.forEachSettings = function (callback) {
            if(this.settingsList && typeof callback === "function") {
                for(var i = 0; i < this.settingsList.length; i++) {
                    var settings = this.settingsList[i];
                    if(settings) {
                        callback(settings);
                    }
                }
            }
        };
        AsyncInvokerBase.prototype.removeAllSettings = function () {
            if(this.settingsList) {
                var toRemove = this.settingsList.splice(0);
                if(toRemove) {
                    for(var i = 0; i < toRemove.length; i++) {
                        this.removeSettings(toRemove[i]);
                    }
                }
            }
        };
        return AsyncInvokerBase;
    })();
    Retrieve.AsyncInvokerBase = AsyncInvokerBase;    
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
            this.addSettings(settings);
        }
        AsyncOperationExecutor.prototype.addSettings = function (settings) {
            this.settingsList = this.settingsList || [];
            if(settings && this.settingsList.indexOf(settings) == -1) {
                this.settingsList.push(settings);
                if(this.inProgress) {
                    this.callBefore(settings);
                }
            }
        };
        AsyncOperationExecutor.prototype.removeSettings = function (settings) {
            if(settings && this.settingsList) {
                var index = this.settingsList.indexOf(settings);
                if(index != -1) {
                    this.settingsList.splice(index, 1);
                }
                if(this.inProgress) {
                    this.callComplete(settings, null, Retrieve.CompleteStatus.abort);
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
            if(settings) {
                if(typeof settings.before === "function") {
                    settings.before();
                }
                if(settings.beforeSignal && typeof settings.beforeSignal.trigger === "function") {
                    settings.beforeSignal.trigger();
                }
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
                if(settings.completeSignal && typeof settings.completeSignal.trigger === "function") {
                    settings.completeSignal.trigger(data, status);
                }
            }
        };
        return AsyncOperationExecutor;
    })();
    Retrieve.AsyncOperationExecutor = AsyncOperationExecutor;    
})(Retrieve || (Retrieve = {}));
var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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
    var AsyncOperationInvoker = (function (_super) {
        __extends(AsyncOperationInvoker, _super);
        function AsyncOperationInvoker(createOperationFunction) {
                _super.call(this);
            this.createOperationFunction = createOperationFunction;
            this.beforeSignal = new Retrieve.Signal();
            this.completeSignal = new Retrieve.Signal();
            this.operationsInProgress = [];
        }
        AsyncOperationInvoker.prototype.isInProgress = function () {
            return !!(this.currentExecutor);
        };
        AsyncOperationInvoker.prototype.addSettings = function (settings) {
            _super.prototype.addSettings.call(this, settings);
            if(this.currentExecutor) {
                this.currentExecutor.addSettings(settings);
            }
        };
        AsyncOperationInvoker.prototype.removeSettings = function (settings) {
            _super.prototype.removeSettings.call(this, settings);
            if(this.currentExecutor) {
                this.currentExecutor.removeSettings(settings);
            }
        };
        AsyncOperationInvoker.prototype.execute = function (settings) {
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
        AsyncOperationInvoker.prototype.createExecutor = function (operation, settings) {
            var _this = this;
            if(this.beforeSignal) {
                this.beforeSignal.trigger();
            }
            var executor = new Retrieve.AsyncOperationExecutor(operation, settings);
            this.forEachSettings(function (settings) {
                executor.addSettings(settings);
            });
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
        return AsyncOperationInvoker;
    })(Retrieve.AsyncInvokerBase);
    Retrieve.AsyncOperationInvoker = AsyncOperationInvoker;    
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
        OperationsRepository.prototype.getHash = function (settings) {
            var type;
            var result;
            if(settings) {
                type = settings.type;
                var item = this.getItem(type);
                if(item && item.settings && typeof item.settings.dataHash === "function") {
                    result = item.settings.dataHash(settings);
                } else {
                    result = this.defaultDataHash(settings);
                }
            }
            return type + "/" + result;
        };
        OperationsRepository.prototype.defaultDataHash = function (settings) {
            var result;
            if(settings) {
                var data = "";
                if(typeof settings.data !== "undefined") {
                    data = JSON.stringify(settings.data);
                }
                if(data && data !== "") {
                    result = data;
                }
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
            this.invokers = {
            };
        }
        OperationsManager.prototype.getInvoker = function (settings, createNew) {
            if (typeof createNew === "undefined") { createNew = true; }
            var invoker;
            if(settings) {
                var hash = this.hash(settings);
                invoker = this.invokers[hash];
                if(!invoker && createNew) {
                    invoker = new Retrieve.AsyncOperationInvoker(this.repository.getCreateMethod(settings.type));
                    this.invokers[hash] = invoker;
                }
            }
            return invoker;
        };
        OperationsManager.prototype.addSettings = function (settings) {
            var invoker = this.getInvoker(settings, true);
            if(invoker) {
                invoker.addSettings(settings);
            }
        };
        OperationsManager.prototype.hasSettings = function (settings) {
            var invoker = this.getInvoker(settings, false);
            return settings && invoker && invoker.hasSettings(settings);
        };
        OperationsManager.prototype.removeSettings = function (settings) {
            var invoker = this.getInvoker(settings, false);
            if(invoker) {
                invoker.removeSettings(settings);
            }
            this.cleanupManager(settings, invoker);
        };
        OperationsManager.prototype.execute = function (settings) {
            var result;
            var invoker = this.getInvoker(settings, false);
            if(invoker) {
                result = invoker.execute(settings);
            }
            return result;
        };
        OperationsManager.prototype.cleanupManager = function (settings, invoker) {
            if (typeof invoker === "undefined") { invoker = null; }
            if(!invoker) {
                invoker = this.getInvoker(settings, false);
            }
            if(invoker && typeof invoker.isInProgress === "function" && !invoker.isInProgress() && typeof invoker.settingsListCount === "function" && invoker.settingsListCount() === 0) {
                var hash = this.hash(settings);
                delete this.invokers[hash];
            }
        };
        OperationsManager.prototype.hash = function (settings) {
            return this.repository.getHash(settings);
        };
        return OperationsManager;
    })();
    Retrieve.OperationsManager = OperationsManager;    
})(Retrieve || (Retrieve = {}));
var Retrieve;
(function (Retrieve) {
    var RetrieveConverter = (function () {
        function RetrieveConverter() { }
        RetrieveConverter.toRetrieveOperation = function toRetrieveOperation(operation) {
            if(operation && typeof operation.execute === "function") {
                (operation).retrieve = operation.execute;
            }
            return operation;
        };
        return RetrieveConverter;
    })();    
    var RetrieveInvokerWrapper = (function (_super) {
        __extends(RetrieveInvokerWrapper, _super);
        function RetrieveInvokerWrapper(manager, settings) {
                _super.call(this);
            this.manager = manager;
            this.settings = settings;
            this.addSettings(settings);
        }
        RetrieveInvokerWrapper.prototype.validateSettingsType = function (settings) {
            if(settings) {
                settings.type = this.settings.type;
            }
        };
        RetrieveInvokerWrapper.prototype.addSettings = function (settings) {
            this.validateSettingsType(settings);
            _super.prototype.addSettings.call(this, settings);
            if(this.manager) {
                this.manager.addSettings(settings);
            }
        };
        RetrieveInvokerWrapper.prototype.removeSettings = function (settings) {
            this.validateSettingsType(settings);
            _super.prototype.removeSettings.call(this, settings);
            if(this.manager) {
                this.manager.removeSettings(settings);
            }
        };
        RetrieveInvokerWrapper.prototype.retrieve = function (settings) {
            var result;
            this.validateSettingsType(settings);
            if(this.manager) {
                result = this.manager.retrieve(settings || this.settings);
            }
            return result;
        };
        RetrieveInvokerWrapper.prototype.dispose = function () {
            this.removeAllSettings();
        };
        return RetrieveInvokerWrapper;
    })(Retrieve.AsyncInvokerBase);    
    var RetrieveOperationManager = (function (_super) {
        __extends(RetrieveOperationManager, _super);
        function RetrieveOperationManager(manager) {
                _super.call(this);
            this.manager = manager;
        }
        RetrieveOperationManager.prototype.prepareSettings = function (typeOrSettings, settings) {
            settings = settings || (typeof typeOrSettings === "object" ? typeOrSettings : undefined) || {
            };
            if(!settings.type && typeof typeOrSettings === "string") {
                settings.type = typeOrSettings;
            }
            return settings;
        };
        RetrieveOperationManager.prototype.addSettings = function (settings) {
            _super.prototype.addSettings.call(this, settings);
            if(settings) {
                var invoker = Retrieve.manager.getInvoker(settings, true);
                if(invoker) {
                    invoker.addSettings(settings);
                }
            }
        };
        RetrieveOperationManager.prototype.removeSettings = function (settings) {
            _super.prototype.removeSettings.call(this, settings);
            if(settings) {
                var invoker = Retrieve.manager.getInvoker(settings, false);
                if(invoker) {
                    invoker.removeSettings(settings);
                }
            }
        };
        RetrieveOperationManager.prototype.configure = function (typeOrSettings, settings) {
            settings = this.prepareSettings(typeOrSettings, settings);
            var invoker = new RetrieveInvokerWrapper(this, settings);
            invoker.addSettings(settings);
            return invoker;
        };
        RetrieveOperationManager.prototype.unconfigure = function (typeOrSettings, settings) {
            settings = this.prepareSettings(typeOrSettings, settings);
            this.removeSettings(settings);
        };
        RetrieveOperationManager.prototype.retrieve = function (typeOrSettings, settings) {
            settings = this.prepareSettings(typeOrSettings, settings);
            return RetrieveConverter.toRetrieveOperation(this.manager.execute(settings));
        };
        RetrieveOperationManager.prototype.dispose = function () {
            this.removeAllSettings();
        };
        return RetrieveOperationManager;
    })(Retrieve.AsyncInvokerBase);    
    Retrieve.repository = new Retrieve.OperationsRepository();
    Retrieve.manager = new Retrieve.OperationsManager(Retrieve.repository);
    function retriever() {
        return new RetrieveOperationManager(Retrieve.manager);
    }
    Retrieve.retriever = retriever;
            function configure(typeOrSettings, settings) {
        return retriever().configure(typeOrSettings, settings);
    }
    Retrieve.configure = configure;
})(Retrieve || (Retrieve = {}));
var Retrieve;
(function (Retrieve) {
    var BackboneAdapter = (function (_super) {
        __extends(BackboneAdapter, _super);
        function BackboneAdapter(modelOrCollection, typeOrProxiedSettings, dataOrProxiedSettings, proxiedSettings) {
            if (typeof typeOrProxiedSettings === "undefined") { typeOrProxiedSettings = null; }
            if (typeof dataOrProxiedSettings === "undefined") { dataOrProxiedSettings = null; }
            if (typeof proxiedSettings === "undefined") { proxiedSettings = null; }
                _super.call(this);
            this.model = modelOrCollection;
            this.proxiedSettings = proxiedSettings || dataOrProxiedSettings || (typeof typeOrProxiedSettings !== "string" ? typeOrProxiedSettings : null);
            if(typeof typeOrProxiedSettings === "string") {
                this.type = typeOrProxiedSettings;
            }
            if(proxiedSettings && dataOrProxiedSettings) {
                this.data = dataOrProxiedSettings;
            }
            if(this.completeSignal) {
                this.completeSignal.add(this.onComplete, this);
            }
        }
        BackboneAdapter.prototype.onComplete = function (data, status) {
            if(status == Retrieve.CompleteStatus.success && this.model) {
                if(typeof (this.model).reset === "function") {
                    this.model.reset(data);
                } else if(typeof (this.model).save === "function") {
                    this.model.save(data);
                }
            }
        };
        BackboneAdapter.prototype.before = function () {
            if(this.proxiedSettings && typeof this.proxiedSettings.before === "function") {
                this.proxiedSettings.before();
            }
        };
        BackboneAdapter.prototype.complete = function (data, status) {
            if(this.proxiedSettings && typeof this.proxiedSettings.complete === "function") {
                this.proxiedSettings.complete(data, status);
            }
        };
        BackboneAdapter.prototype.success = function (data) {
            if(this.proxiedSettings && typeof this.proxiedSettings.success === "function") {
                this.proxiedSettings.success(data);
            }
        };
        BackboneAdapter.prototype.error = function (info) {
            if(this.proxiedSettings && typeof this.proxiedSettings.error === "function") {
                this.proxiedSettings.error(info);
            }
        };
        return BackboneAdapter;
    })(Retrieve.AsyncSettingsBase);
    Retrieve.BackboneAdapter = BackboneAdapter;    
})(Retrieve || (Retrieve = {}));
