///<reference path='repository.ts' />
///<reference path='operation/invoker.ts' />
///<reference path='manager.ts' />
///<reference path='base.ts' />

module Retrieve
{
    class RetrieveConverter {
        static toRetrieveOperation(operation:{ execute:(...args:any[]) => void; }):RetrieveOperation {
            if (operation && typeof operation.execute === "function") {
                (<RetrieveOperation>operation).retrieve = operation.execute;
            }
            return <RetrieveOperation>operation;
        }
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

        configure(type:string, settings:AsyncSettings):RetrieveOperation;
        configure(settings:AsyncSettings):RetrieveOperation;
        configure(typeOrSettings?:any, settings?:AsyncSettings):RetrieveOperation {

            this.settingsList = this.settingsList || [];
            settings = this.prepareSettings(typeOrSettings, settings);
            if (settings) {
                if (this.settingsList.indexOf(settings) == -1)
                    this.settingsList.push(settings);
                if (this.manager) {
                    var invoker:AsyncInvoker = manager.getInvoker(settings);
                }
                    this.manager.addSettings(settings);
            }

            var invoker:AsyncInvoker = manager.getInvoker(settings, true);
            if (invoker)
                invoker.addSettings(settings);
            return RetrieveConverter.toRetrieveOperation(invoker);
        }

        unconfigure(type:string, settings:AsyncSettings);
        unconfigure(settings:AsyncSettings);
        unconfigure(typeOrSettings?:any, settings?:AsyncSettings) {
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

        retrieve(type:string, settings:AsyncSettings):RetrieveOperation;
        retrieve(settings:AsyncSettings):RetrieveOperation;
        retrieve(type:string):RetrieveOperation;
        retrieve(typeOrSettings?:any, settings?:AsyncSettings):RetrieveOperation {
            settings = this.prepareSettings(typeOrSettings, settings);
            return RetrieveConverter.toRetrieveOperation(this.manager.execute(settings));
        }

        dispose() {
            if (this.settingsList) {
                var toRemove:AsyncSettings[] = this.settingsList.slice(0);
                for (var i:number = 0; i < toRemove.length; i++) {
                    this.unconfigure(toRemove[i]);
                }
            }
        }
    }

    export var repository:OperationsRepository = new OperationsRepository();
    export var manager:OperationsManager = new OperationsManager(repository);

    export function retriever():RetrieveManager {
        return new RetrieveOperationManager(manager);
    }
}
