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
        completeSignal?: CompleteSignal;
        settings?: AsyncSettings;
        abort? ();
        execute();
    }
    var CompleteStatus: {
        success: string;
        error: string;
        timeout: string;
        abort: string;
    };
    class AsyncOperationBase {
        public completeSignal: CompleteSignal;
        public settings: AsyncSettings;
        constructor();
        public complete(data: any, status: string): void;
        public abort(): void;
        public execute(): void;
    }
}
module Retrieve {
    class AsyncOperationExecutor implements AsyncOperation {
        private operation;
        public settings: AsyncSettings;
        public beforeSignal: EmptySignal;
        public completeSignal: CompleteSignal;
        private settingsList;
        private inProgress;
        private timeoutId;
        public timeout: number;
        constructor(operation: AsyncOperation, settings: AsyncSettings);
        public addSettings(settings: AsyncSettings, withCallback?: bool): void;
        public removeSettings(settings: AsyncSettings, withCallback?: bool): void;
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
    class AsyncOperationManager {
        private createOperationFunction;
        public beforeSignal: EmptySignal;
        public completeSignal: CompleteSignal;
        private currentExecutor;
        private operationsInProgress;
        private settingsList;
        constructor(createOperationFunction: (settings: AsyncSettings) => AsyncOperation);
        public addSettings(settings: AsyncSettings): void;
        public removeSettings(settings: AsyncSettings): void;
        public hasSettings(settings: AsyncSettings): bool;
        public isInProgress(): bool;
        public settingsListCount(): number;
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
    class OperationsManager {
        private repository;
        private managers;
        constructor(repository: OperationsRepository);
        public getManager(settings: AsyncSettings, createNewManager?: bool): AsyncOperationManager;
        public addSettings(settings: AsyncSettings): void;
        public hasSettings(settings: AsyncSettings): bool;
        public removeSettings(settings: AsyncSettings): void;
        public execute(settings: AsyncSettings): AsyncOperation;
        public hash(settings: AsyncSettings): string;
        private cleanupManager(settings, manager?);
    }
}
module Retrieve {
    interface RetrieveManager {
        configure(type: string, settings: AsyncSettings);
        configure(settings: AsyncSettings);
        dispose();
        retrieve(type: string, settings: AsyncSettings): AsyncOperation;
        retrieve(settings: AsyncSettings): AsyncOperation;
        retrieve(type: string): AsyncOperation;
    }
    var repository: OperationsRepository;
    var manager: OperationsManager;
    function retriever(): RetrieveManager;
}
