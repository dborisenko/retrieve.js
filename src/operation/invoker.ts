///<reference path='base.ts' />
///<reference path='executor.ts' />

module Retrieve
{
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

    export class AsyncOperationManager implements AsyncOperation, AsyncMultiOperation, AsyncInvoker, AsyncProcessInvoker {
        beforeSignal:EmptySignal = new Signal();
        completeSignal:CompleteSignal = new Signal();

        private currentExecutor:AsyncOperationExecutor;
        private operationsInProgress:AsyncOperationWrapper[] = [];

        private settingsList:AsyncSettings[] = [];

        constructor(private createOperationFunction: (settings:AsyncSettings) => AsyncOperation) {
        }

        addSettings(settings:AsyncSettings) {
            this.settingsList = this.settingsList || [];
            if (settings && !this.hasSettings(settings)) {
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
}
