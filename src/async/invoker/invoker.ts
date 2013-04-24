///<reference path='base.ts' />
///<reference path='../operation/executor.ts' />

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

    export class AsyncOperationInvoker extends AsyncInvokerBase implements AsyncOperation, AsyncMultiOperation, AsyncInvoker, AsyncProcessInvoker {
        beforeSignal:EmptySignal = new Signal();
        completeSignal:CompleteSignal = new Signal();

        private currentExecutor:AsyncOperationExecutor;
        private operationsInProgress:AsyncOperationWrapper[] = [];

        constructor(private createOperationFunction: (settings:AsyncSettings) => AsyncOperation) {
            super();
        }

        isInProgress():bool {
            return !!(this.currentExecutor);
        }

        addSettings(settings:AsyncSettings) {
            super.addSettings(settings);
            if (this.currentExecutor)
                this.currentExecutor.addSettings(settings);
        }

        removeSettings(settings:AsyncSettings) {
            super.removeSettings(settings);
            if (this.currentExecutor)
                this.currentExecutor.removeSettings(settings);
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

            this.forEachSettings((settings:AsyncSettings) => {
                executor.addSettings(settings);
            });

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
