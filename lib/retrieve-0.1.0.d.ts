module Retrieve {
    class Signal {
        private callbacks;
        public add(callback: (...args: any[]) => void, context?: any): void;
        public remove(callback: (...args: any[]) => void, context?: any): void;
        public trigger(...args: any[]): void;
        private getCallbackIndex(callback, context?);
    }
}
module Retrieve {
    interface CompleteSignal {
        add(callback: (data: any, status: string) => void, context?: any);
        remove(callback: (data: any, status: string) => void, context?: any);
        trigger(data: any, status: string);
    }
    interface EmptySignal {
        add(callback: () => void, context?: any);
        remove(callback: () => void, context?: any);
        trigger();
    }
    interface AsyncSettings {
        before? ();
        complete? (data: any, status: string);
        success? (data: any);
        error? (info: any);
        type?: string;
        data?: any;
    }
    interface AsyncOperation {
        beforeSignal?: EmptySignal;
        completeSignal?: CompleteSignal;
        settings?: AsyncSettings;
        abort? ();
        execute();
    }
    interface AsyncMultiOperation extends AsyncOperation {
        addSettings(settings: AsyncSettings);
        removeSettings(settings: AsyncSettings);
        execute(settings?: AsyncSettings);
    }
    var CompleteStatus: {
        success: string;
        error: string;
        timeout: string;
        abort: string;
    };
    class AsyncOperationBase implements AsyncOperation {
        public completeSignal: CompleteSignal;
        public settings: AsyncSettings;
        constructor();
        public complete(data: any, status: string): void;
        public abort(): void;
        public execute(): void;
    }
}
module Retrieve {
    interface AsyncInvoker {
        addSettings(settings: AsyncSettings);
        removeSettings(settings: AsyncSettings);
        hasSettings(settings: AsyncSettings): bool;
        execute? (settings?: AsyncSettings): AsyncOperation;
    }
    interface AsyncProcessInvoker extends AsyncInvoker {
        isInProgress(): bool;
        settingsListCount(): number;
    }
    class AsyncInvokerBase implements AsyncInvoker {
        private settingsList;
        public addSettings(settings: AsyncSettings): void;
        public removeSettings(settings: AsyncSettings): void;
        public hasSettings(settings: AsyncSettings): bool;
        public settingsListCount(): number;
        public forEachSettings(callback: (settings: AsyncSettings) => void): void;
        public removeAllSettings(): void;
    }
}
module Retrieve {
    interface RetrieveOperation extends AsyncOperation {
        retrieve();
    }
    interface RetrieveMultiOperation extends RetrieveOperation, AsyncMultiOperation {
        retrieve(settings?: AsyncSettings);
    }
    interface RetrieveInvoker extends AsyncInvoker {
        retrieve(settings?: AsyncSettings): RetrieveOperation;
        dispose();
    }
    interface RetrieveManager {
        configure(type: string, settings: AsyncSettings): RetrieveInvoker;
        configure(settings: AsyncSettings): RetrieveInvoker;
        unconfigure(type: string, settings: AsyncSettings);
        unconfigure(settings: AsyncSettings);
        dispose();
        retrieve(type: string, settings: AsyncSettings): RetrieveOperation;
        retrieve(settings: AsyncSettings): RetrieveOperation;
        retrieve(type: string): RetrieveOperation;
    }
}
module Retrieve {
    class AsyncOperationExecutor implements AsyncOperation, AsyncMultiOperation {
        private operation;
        public settings: AsyncSettings;
        public beforeSignal: EmptySignal;
        public completeSignal: CompleteSignal;
        private settingsList;
        private inProgress;
        private timeoutId;
        public timeout: number;
        constructor(operation: AsyncOperation, settings: AsyncSettings);
        public addSettings(settings: AsyncSettings): void;
        public removeSettings(settings: AsyncSettings): void;
        public execute(): void;
        public abort(): void;
        private initOperation();
        private disposeOperation();
        private abortOperation();
        private executeOperation();
        private initTimeout();
        private disposeTimeout();
        private onTimeout();
        private onBefore();
        private onComplete(data, status);
        private callForEach(settingsList, callback);
        private callBefore(settings);
        private callComplete(settings, data, status);
    }
}
module Retrieve {
    class AsyncOperationWrapper implements AsyncOperation {
        public settings: AsyncSettings;
        private executor;
        public completeSignal: CompleteSignal;
        constructor(settings: AsyncSettings, executor: AsyncOperationExecutor);
        public execute(): void;
        public abort(): void;
        private onExecutorComplete(data, status);
    }
    class AsyncOperationInvoker extends AsyncInvokerBase implements AsyncOperation, AsyncMultiOperation, AsyncInvoker, AsyncProcessInvoker {
        private createOperationFunction;
        public beforeSignal: EmptySignal;
        public completeSignal: CompleteSignal;
        private currentExecutor;
        private operationsInProgress;
        constructor(createOperationFunction: (settings: AsyncSettings) => AsyncOperation);
        public isInProgress(): bool;
        public addSettings(settings: AsyncSettings): void;
        public removeSettings(settings: AsyncSettings): void;
        public execute(settings?: AsyncSettings): AsyncOperation;
        private createExecutor(operation, settings);
    }
}
module Retrieve {
    interface ExecuteSettings {
    }
    interface OperationsRepositoryItem {
        type: string;
        createOperationFunction: (settings: AsyncSettings) => AsyncOperation;
        settings?: ExecuteSettings;
    }
    class OperationsRepository {
        private dictionary;
        public add(type: string, createOperationFunction: (settings: AsyncSettings) => AsyncOperation, settings?: ExecuteSettings): void;
        public remove(type: string): void;
        private getItem(type);
        public getCreateMethod(type: string): (settings: AsyncSettings) => AsyncOperation;
    }
}
module Retrieve {
    class OperationsManager implements AsyncInvoker {
        private repository;
        private invokers;
        constructor(repository: OperationsRepository);
        public getInvoker(settings: AsyncSettings, createNew?: bool): AsyncInvoker;
        public addSettings(settings: AsyncSettings): void;
        public hasSettings(settings: AsyncSettings): bool;
        public removeSettings(settings: AsyncSettings): void;
        public execute(settings?: AsyncSettings): AsyncOperation;
        public hash(settings: AsyncSettings): string;
        private cleanupManager(settings, invoker?);
    }
}
module Retrieve {
    var repository: OperationsRepository;
    var manager: OperationsManager;
    function retriever(): RetrieveManager;
    function configure(type: string, settings: AsyncSettings): RetrieveInvoker;
    function configure(settings: AsyncSettings): RetrieveInvoker;
}
