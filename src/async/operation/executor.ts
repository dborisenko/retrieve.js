///<reference path='base.ts' />

module Retrieve
{
    /**
     * Async operation executor.
     * Responsible for executing only one instance of operation, even if there are more than one attempts to execute this
     * operation with the different settings.
     * It's possible to add or remove settings even when operation in progress. If all settings are removed, operation is aborted.
     * Supports timeout.
     */
    export class AsyncOperationExecutor implements AsyncOperation, AsyncMultiOperation {
        beforeSignal:EmptySignal = new Signal();
        completeSignal:CompleteSignal = new Signal();

        private settingsList:AsyncSettings[] = [];

        private inProgress:bool = false;

        private timeoutId:any;

        timeout:number = 10000;

        constructor(private operation:AsyncOperation, public settings:AsyncSettings) {
            this.addSettings(settings);
        }

        addSettings(settings:AsyncSettings) {
            this.settingsList = this.settingsList || [];
            if (settings && this.settingsList.indexOf(settings) == -1) {
                this.settingsList.push(settings);
                if (this.inProgress)
                    this.callBefore(settings);
            }
        }

        removeSettings(settings:AsyncSettings) {
            if (settings && this.settingsList) {
                var index:number = this.settingsList.indexOf(settings);
                if (index != -1)
                    this.settingsList.splice(index, 1);

                if (this.inProgress) {
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
            if (settings) {
                if (typeof settings.before === "function")
                    settings.before();
                if (settings.beforeSignal && typeof settings.beforeSignal.trigger === "function")
                    settings.beforeSignal.trigger();
            }
        }

        private callComplete(settings:AsyncSettings, data:any, status:string) {
            if (settings) {
                if (status == CompleteStatus.success && typeof settings.success === "function")
                    settings.success(data);
                else if (status == CompleteStatus.error && typeof settings.error === "function")
                    settings.error(data);

                if (typeof settings.complete === "function")
                    settings.complete(data, status);
                if (settings.completeSignal && typeof settings.completeSignal.trigger === "function")
                    settings.completeSignal.trigger(data, status);
            }
        }
    }
}
