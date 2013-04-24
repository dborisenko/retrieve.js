///<reference path='invoker/invoker.ts' />
///<reference path='repository.ts' />

module Retrieve
{
    export class OperationsManager implements AsyncInvoker {

        private invokers:any = {};

        constructor(private repository:OperationsRepository) {
        }

        getInvoker(settings:AsyncSettings, createNew:bool = true):AsyncInvoker {
            var invoker:AsyncInvoker;
            if (settings) {
                var hash = this.hash(settings);
                invoker = <AsyncInvoker>this.invokers[hash];
                if (!invoker && createNew) {
                    invoker = new Retrieve.AsyncOperationInvoker(this.repository.getCreateMethod(settings.type));
                    this.invokers[hash] = invoker;
                }
            }
            return invoker;
        }

        addSettings(settings:AsyncSettings) {
            var invoker:AsyncInvoker = this.getInvoker(settings, true);
            if (invoker)
                invoker.addSettings(settings);
        }

        hasSettings(settings:AsyncSettings) {
            var invoker:AsyncInvoker = this.getInvoker(settings, false);
            return settings && invoker && invoker.hasSettings(settings);
        }

        removeSettings(settings:AsyncSettings) {
            var invoker:AsyncInvoker = this.getInvoker(settings, false);
            if (invoker)
                invoker.removeSettings(settings);
            this.cleanupManager(settings, <AsyncProcessInvoker>invoker);
        }

        execute(settings?:AsyncSettings):AsyncOperation {
            var result:AsyncOperation;
            var invoker:AsyncInvoker = this.getInvoker(settings, false);
            if (invoker)
                result = invoker.execute(settings);
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

        private cleanupManager(settings:AsyncSettings, invoker:AsyncProcessInvoker = null) {
            if (!invoker)
                invoker = <AsyncProcessInvoker>this.getInvoker(settings, false);
            if (invoker && typeof invoker.isInProgress === "function" && !invoker.isInProgress() && typeof invoker.settingsListCount === "function" && invoker.settingsListCount() === 0) {
                var hash = this.hash(settings);
                delete this.invokers[hash];
            }
        }
    }
}