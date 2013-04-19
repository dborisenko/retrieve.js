///<reference path='repository.ts' />
///<reference path='operation/manager.ts' />
///<reference path='manager.ts' />

module Retrieve
{
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
