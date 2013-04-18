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

    export interface CompleteSignal {
        add(callback: (data:any, status:string) => void, context?:any);
        remove(callback: (data:any, status:string) => void, context?:any);
        trigger(data:any, status:string);
    }

    export interface EmptySignal {
        add(callback: () => void, context?:any);
        remove(callback: () => void, context?:any);
        trigger();
    }

    export interface AsyncSettings {
        before?();
        complete?(data:any, status:string);
        success?(data:any);
        error?(info:any);

        type?:string;
        data?:any;
    }

    export interface AsyncOperation {
        completeSignal?:CompleteSignal;

        settings?:AsyncSettings;

        abort?();
        execute();
    }

    export var CompleteStatus = {
        success: "success",
        error: "error",
        timeout: "timeout",
        abort: "abort"
    };

    export class AsyncOperationBase {
        completeSignal:CompleteSignal = new Signal();
        settings:AsyncSettings;

        constructor() {
        }

        complete(data:any, status:string) {
            if (this.completeSignal)
                this.completeSignal.trigger(data, status);
        }

        abort() {
        }

        execute() {
        }
    }

    /**
     * Async operation executor.
     * Responsible for executing only one instance of operation, even if there are more than one attempts to execute this
     * operation with the different settings.
     * It's possible to add or remove settings even when operation in progress. If all settings are removed, operation is aborted.
     * Supports timeout.
     */
    export class AsyncOperationExecutor implements AsyncOperation {
        beforeSignal:EmptySignal = new Signal();
        completeSignal:CompleteSignal = new Signal();

        private settingsList:AsyncSettings[] = [];

        private inProgress:bool = false;

        private timeoutId:any;

        timeout:number = 10000;

        constructor(private operation:AsyncOperation, public settings:AsyncSettings) {
            this.addSettings(settings, false);
        }

        addSettings(settings:AsyncSettings, withCallback:bool = true) {
            this.settingsList = this.settingsList || [];
            if (settings && this.settingsList.indexOf(settings) == -1) {
                this.settingsList.push(settings);
                if (withCallback && this.inProgress)
                    this.callBefore(settings);
            }
        }

        removeSettings(settings:AsyncSettings, withCallback:bool = true) {
            if (settings && this.settingsList) {
                var index:number = this.settingsList.indexOf(settings);
                if (index != -1)
                    this.settingsList.splice(index, 1);

                if (this.inProgress) {
                    if (withCallback)
                        this.callComplete(settings, null, CompleteStatus.abort);
                    if (this.settingsList.length == 0)
                        this.abort();
                }
            }
        }

        execute() {
            if (!this.inProgress) {
                this.onBefore();
                this.executeOperation();
            }
        }

        abort() {
            if (this.inProgress) {
                this.onComplete(null, CompleteStatus.abort);
                this.abortOperation();
            }
        }

        private initOperation() {
            if (this.operation) {
                this.operation.settings = this.settings;
                if (this.operation.completeSignal)
                    this.operation.completeSignal.add(this.onComplete, this);
            }
        }

        private disposeOperation() {
            if (this.operation && this.operation.completeSignal) {
                this.operation.completeSignal.remove(this.onComplete, this);
            }
        }

        private abortOperation() {
            if (this.operation && typeof this.operation.abort === "function")
                this.operation.abort();
        }

        private executeOperation() {
            if (this.operation && typeof this.operation.execute === "function")
                this.operation.execute();
        }

        private initTimeout() {
            this.disposeTimeout();
            if (this.timeout > 0)
                this.timeoutId = setTimeout(() => {
                    this.onTimeout();
                }, this.timeout);
        }

        private disposeTimeout() {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
                this.timeoutId = undefined;
            }
        }

        private onTimeout() {
            if (this.inProgress) {
                this.onComplete(null, CompleteStatus.timeout);
                this.abortOperation();
            }
            this.disposeTimeout();
        }

        private onBefore() {
            this.callForEach(this.settingsList, (settings:AsyncSettings) => {
                this.callBefore(settings);
            });
            if (this.beforeSignal)
                this.beforeSignal.trigger();

            this.inProgress = true;
            this.initOperation();
            this.initTimeout();
        }

        private onComplete(data:any, status:string) {
            this.disposeOperation();
            this.disposeTimeout();
            this.inProgress = false;

            this.callForEach(this.settingsList, (settings:AsyncSettings) => {
                this.callComplete(settings, data, status);
            });
            if (this.completeSignal)
                this.completeSignal.trigger(data, status);
        }

        private callForEach(settingsList:AsyncSettings[], callback:(settings:AsyncSettings) => void) {
            if (settingsList && typeof callback === "function") {
                for (var i:number = 0; i < settingsList.length; i++) {
                    var settings:AsyncSettings = settingsList[i];
                    if (settings)
                        callback.apply(this, [settings]);
                }
            }
        }

        private callBefore(settings:AsyncSettings) {
            if (settings && typeof settings.before === "function")
                settings.before();
        }

        private callComplete(settings:AsyncSettings, data:any, status:string) {
            if (settings) {
                if (status == CompleteStatus.success && typeof settings.success === "function")
                    settings.success(data);
                else if (status == CompleteStatus.error && typeof settings.error === "function")
                    settings.error(data);

                if (typeof settings.complete === "function")
                    settings.complete(data, status);
            }
        }
    }

    export class AsyncOperationWrapper implements AsyncOperation {
        completeSignal:CompleteSignal = new Signal();

        constructor(public settings:AsyncSettings, private executor:AsyncOperationExecutor) {
        }

        execute() {
            if (this.settings && this.executor) {
                if (this.executor.completeSignal)
                    this.executor.completeSignal.add(this.onExecutorComplete, this);
                this.executor.addSettings(this.settings);
                this.executor.execute();
            }
        }

        abort() {
            if (this.settings && this.executor) {
                this.executor.removeSettings(this.settings);
                if (this.executor.completeSignal)
                    this.executor.completeSignal.remove(this.onExecutorComplete, this);
            }
        }

        private onExecutorComplete(data:any, status:string) {
            if (this.completeSignal)
                this.completeSignal.trigger(data, status);
        }
    }

    export class AsyncOperationManager {
        beforeSignal:EmptySignal = new Signal();
        completeSignal:CompleteSignal = new Signal();

        private currentExecutor:AsyncOperationExecutor;
        private operationsInProgress:AsyncOperationWrapper[] = [];

        private settingsList:AsyncSettings[] = [];

        constructor(private createOperationFunction: (settings:AsyncSettings) => AsyncOperation) {
        }

        addSettings(settings:AsyncSettings) {
            this.settingsList = this.settingsList || [];
            if (settings) {
                if (this.settingsList.indexOf(settings) == -1)
                    this.settingsList.push(settings);
                if (this.currentExecutor)
                    this.currentExecutor.addSettings(settings);
            }
        }

        removeSettings(settings:AsyncSettings) {
            if (settings) {
                if (this.settingsList) {
                    var index:number = this.settingsList.indexOf(settings);
                    if (index != -1)
                        this.settingsList.splice(index, 1);
                }
                if (this.currentExecutor)
                    this.currentExecutor.removeSettings(settings);
            }
        }

        hasSettings(settings:AsyncSettings):bool {
            return settings && this.settingsList && this.settingsList.indexOf(settings) != -1;
        }

        isInProgress():bool {
            return !!(this.currentExecutor);
        }

        settingsListCount():number {
            return this.settingsList ? this.settingsList.length : 0;
        }

        execute(settings:AsyncSettings = null):AsyncOperation {
            if (!this.currentExecutor)
                this.currentExecutor = this.createExecutor(this.createOperationFunction(settings), settings);

            var operation:AsyncOperationWrapper = new AsyncOperationWrapper(settings, this.currentExecutor);

            this.operationsInProgress.push(operation);

            if (operation.completeSignal) {
                var onComplete = (data:any, status:string) => {
                    operation.completeSignal.remove(onComplete, this);
                    var index:number = this.operationsInProgress.indexOf(operation);
                    if (index >= 0)
                        this.operationsInProgress.splice(index, 1);
                };

                operation.completeSignal.add(onComplete, this);
            }

            operation.execute();
            return operation;
        }

        private createExecutor(operation:AsyncOperation, settings:AsyncSettings) {
            if (this.beforeSignal)
                this.beforeSignal.trigger();

            var executor:AsyncOperationExecutor = new AsyncOperationExecutor(operation, settings);

            for (var i:number = 0; i < this.settingsList.length; i++) {
                var settings:AsyncSettings = this.settingsList[i];
                if (settings)
                    executor.addSettings(settings);
            }

            if (executor.completeSignal) {
                var onComplete = (data:any, status:string) => {
                    executor.completeSignal.remove(onComplete, this);
                    this.currentExecutor = null;
                    if (this.completeSignal)
                        this.completeSignal.trigger(data, status);
                };
                executor.completeSignal.add(onComplete, this);
            }

            return executor;
        }
    }

    export interface ExecuteSettings {
    }

    interface OperationsRepositoryItem {
        type:string;
        createOperationFunction: (settings:AsyncSettings) => AsyncOperation;
        settings?:ExecuteSettings;
    }

    export class OperationsRepository {
        private dictionary:any = {};

        add(type:string, createOperationFunction: (settings:AsyncSettings) => AsyncOperation, settings:ExecuteSettings = null) {
            if (this.dictionary && type && createOperationFunction) {
                var item:OperationsRepositoryItem = {
                    type: type,
                    createOperationFunction: createOperationFunction,
                };
                if (settings)
                    item.settings = settings;
                this.dictionary[type] = item;
            }
        }

        remove(type:string) {
            if (this.dictionary && type)
                delete this.dictionary[type];
        }

        private getItem(type):OperationsRepositoryItem {
            var item:OperationsRepositoryItem;
            if (this.dictionary && type)
                item = this.dictionary[type];
            return item;
        }

        getCreateMethod(type:string):(settings:AsyncSettings) => AsyncOperation {
            var result:(settings:AsyncSettings) => AsyncOperation;
            var item:OperationsRepositoryItem = this.getItem(type);
            if (item && typeof item.createOperationFunction === "function")
                result = item.createOperationFunction;
            return result;
        }
    }

    export class OperationsManager {

        private managers:any = {};

        constructor(private repository:OperationsRepository) {
        }

        getManager(settings:AsyncSettings, createNewManager:bool = true):AsyncOperationManager {
            var hash = this.hash(settings);
            var manager:AsyncOperationManager = <AsyncOperationManager>this.managers[hash];
            if (!manager && createNewManager) {
                manager = new AsyncOperationManager(this.repository.getCreateMethod(settings.type));
                this.managers[hash] = manager;
            }
            return manager;
        }

        addSettings(settings:AsyncSettings) {
            var manager:AsyncOperationManager = this.getManager(settings, true);
            if (manager)
                manager.addSettings(settings);
        }

        hasSettings(settings:AsyncSettings) {
            var manager:AsyncOperationManager = this.getManager(settings, false);
            return settings && manager && manager.hasSettings(settings);
        }

        removeSettings(settings:AsyncSettings) {
            var manager:AsyncOperationManager = this.getManager(settings, false);
            if (manager)
                manager.removeSettings(settings);
            this.cleanupManager(settings, manager);
        }

        execute(settings:AsyncSettings):AsyncOperation {
            var result:AsyncOperation;
            var manager:AsyncOperationManager = this.getManager(settings, false);
            if (manager)
                result = manager.execute(settings);
            return result;
        }

        hash(settings:AsyncSettings):string {
            var result:string;
            if (settings) {
                var type:string = "";
                if (typeof settings.type !== "undefined")
                    type = settings.type;

                var data:string = "";
                if (typeof settings.data !== "undefined")
                    data = JSON.stringify(settings.data);

                if (type && type !== "" && data && data !== "")
                    result = type + "/" + data;
            }
            return result;
        }

        private cleanupManager(settings:AsyncSettings, manager:AsyncOperationManager = null) {
            if (!manager)
                manager = this.getManager(settings, false);
            if (manager && !manager.isInProgress() && manager.settingsListCount() === 0) {
                var hash = this.hash(settings);
                delete this.managers[hash];
            }
        }
    }

    export interface RetrieveManager {
        configure(type:string, settings:AsyncSettings);
        configure(settings:AsyncSettings);

        dispose();

        retrieve(type:string, settings:AsyncSettings):AsyncOperation;
        retrieve(settings:AsyncSettings):AsyncOperation;
        retrieve(type:string):AsyncOperation;
    }

    class RetrieveOperationManager implements RetrieveManager {
        private settingsList:AsyncSettings[] = [];

        constructor(private manager:OperationsManager) {
        }

        private prepareSettings(typeOrSettings:any, settings:AsyncSettings):AsyncSettings {
            settings = settings || (typeof typeOrSettings === "object" ? typeOrSettings : undefined) || {};
            if (!settings.type && typeof typeOrSettings === "string") {
                settings.type = <string>typeOrSettings;
            }
            return settings;
        }

        addSettings(type:string, settings:AsyncSettings);
        addSettings(settings:AsyncSettings);
        addSettings(typeOrSettings?:any, settings?:AsyncSettings) {
            this.settingsList = this.settingsList || [];
            settings = this.prepareSettings(typeOrSettings, settings);
            if (settings) {
                if (this.settingsList.indexOf(settings) == -1)
                    this.settingsList.push(settings);
                if (this.manager)
                    this.manager.addSettings(settings);
            }
        }

        removeSettings(type:string, settings:AsyncSettings);
        removeSettings(settings:AsyncSettings);
        removeSettings(typeOrSettings?:any, settings?:AsyncSettings) {
            settings = this.prepareSettings(typeOrSettings, settings);
            if (settings) {
                if (this.settingsList) {
                    var index:number = this.settingsList.indexOf(settings);
                    if (index != -1)
                        this.settingsList.splice(index, 1);
                }
                if (this.manager)
                    this.manager.removeSettings(settings);
            }
        }

        removeAllSettings() {
            if (this.settingsList) {
                var toRemove:AsyncSettings[] = this.settingsList.slice(0);
                for (var i:number = 0; i < toRemove.length; i++) {
                    this.removeSettings(toRemove[i]);
                }
            }
        }

        execute(type:string, settings?:AsyncSettings):AsyncOperation;
        execute(settings:AsyncSettings):AsyncOperation;
        execute(typeOrSettings?:any, settings?:AsyncSettings):AsyncOperation {
            settings = this.prepareSettings(typeOrSettings, settings);
            return this.manager.execute(settings);
        }

        configure(type:string, settings:AsyncSettings);
        configure(settings:AsyncSettings);
        configure(typeOrSettings?:any, settings?:AsyncSettings) {
            this.addSettings(typeOrSettings, settings);
        }

        retrieve(type:string, settings:AsyncSettings):AsyncOperation;
        retrieve(settings:AsyncSettings):AsyncOperation;
        retrieve(type:string):AsyncOperation;
        retrieve(typeOrSettings?:any, settings?:AsyncSettings):AsyncOperation {
            return this.execute(typeOrSettings, settings);
        }

        dispose() {
            this.removeAllSettings();
        }
    }

    export var repository:OperationsRepository = new OperationsRepository();
    export var manager:OperationsManager = new OperationsManager(repository);

    export function retriever():Retrieve.RetrieveManager {
        return new RetrieveOperationManager(manager);
    }
}
