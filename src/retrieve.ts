///<reference path='async/operation/base.ts' />
///<reference path='async/manager.ts' />
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

    class RetrieveInvokerWrapper extends AsyncInvokerBase implements RetrieveInvoker {
        constructor(private manager:RetrieveOperationManager, private settings:AsyncSettings) {
            super();
            this.addSettings(settings);
        }

        validateSettingsType(settings:AsyncSettings) {
            if (settings)
                settings.type = this.settings.type;
        }

        addSettings(settings:AsyncSettings) {
            this.validateSettingsType(settings);
            super.addSettings(settings);
            if (this.manager)
                this.manager.addSettings(settings);
        }

        removeSettings(settings:AsyncSettings) {
            this.validateSettingsType(settings);
            super.removeSettings(settings);
            if (this.manager)
                this.manager.removeSettings(settings);
        }

        retrieve(settings?:AsyncSettings):RetrieveOperation {
            var result:RetrieveOperation;
            this.validateSettingsType(settings);
            if (this.manager)
                result = this.manager.retrieve(settings || this.settings);
            return result;
        }

        dispose() {
            this.removeAllSettings();
        }
    }

    class RetrieveOperationManager extends AsyncInvokerBase implements RetrieveManager {
        constructor(private manager:OperationsManager) {
            super();
        }

        private prepareSettings(typeOrSettings:any, settings:AsyncSettings):AsyncSettings {
            settings = settings || (typeof typeOrSettings === "object" ? typeOrSettings : undefined) || {};
            if (!settings.type && typeof typeOrSettings === "string") {
                settings.type = <string>typeOrSettings;
            }
            return settings;
        }

        addSettings(settings:AsyncSettings) {
            super.addSettings(settings);
            if (settings) {
                var invoker:AsyncInvoker = manager.getInvoker(settings, true);
                if (invoker)
                    invoker.addSettings(settings);
            }
        }

        removeSettings(settings:AsyncSettings) {
            super.removeSettings(settings);
            if (settings) {
                var invoker:AsyncInvoker = manager.getInvoker(settings, false);
                if (invoker)
                    invoker.removeSettings(settings);
            }
        }

        configure(type:string, settings:AsyncSettings):RetrieveInvoker;
        configure(settings:AsyncSettings):RetrieveInvoker;
        configure(typeOrSettings?:any, settings?:AsyncSettings):RetrieveInvoker {
            settings = this.prepareSettings(typeOrSettings, settings);

            var invoker:RetrieveInvoker = new RetrieveInvokerWrapper(this, settings);
            invoker.addSettings(settings);
            return invoker;
        }

        unconfigure(type:string, settings:AsyncSettings);
        unconfigure(settings:AsyncSettings);
        unconfigure(typeOrSettings?:any, settings?:AsyncSettings) {
            settings = this.prepareSettings(typeOrSettings, settings);
            this.removeSettings(settings);
        }

        retrieve(type:string, settings:AsyncSettings):RetrieveOperation;
        retrieve(settings:AsyncSettings):RetrieveOperation;
        retrieve(type:string):RetrieveOperation;
        retrieve(typeOrSettings?:any, settings?:AsyncSettings):RetrieveOperation {
            settings = this.prepareSettings(typeOrSettings, settings);
            return RetrieveConverter.toRetrieveOperation(this.manager.execute(settings));
        }

        dispose() {
            this.removeAllSettings();
        }
    }

    export var repository:OperationsRepository = new OperationsRepository();
    export var manager:OperationsManager = new OperationsManager(repository);

    export function retriever():RetrieveManager {
        return new RetrieveOperationManager(manager);
    }

    export function configure(type:string, settings:AsyncSettings):RetrieveInvoker;
    export function configure(settings:AsyncSettings):RetrieveInvoker;
    export function configure(typeOrSettings?:any, settings?:AsyncSettings):RetrieveInvoker {
        return retriever().configure(typeOrSettings, settings);
    }
}
