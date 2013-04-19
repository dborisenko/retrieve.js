///<reference path='operation/manager.ts' />
///<reference path='repository.ts' />

module Retrieve
{
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
}