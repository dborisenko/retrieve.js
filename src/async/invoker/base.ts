///<reference path='../operation/base.ts' />

module Retrieve {
    export interface AsyncInvoker {
        addSettings(settings:AsyncSettings);
        removeSettings(settings:AsyncSettings);
        hasSettings(settings:AsyncSettings):bool;

        execute?(settings?:AsyncSettings):AsyncOperation;
    }

    export interface AsyncProcessInvoker extends AsyncInvoker {
        isInProgress():bool;
        settingsListCount():number;
    }

    export class AsyncInvokerBase implements AsyncInvoker {
        private settingsList:AsyncSettings[] = [];

        addSettings(settings:AsyncSettings) {
            this.settingsList = this.settingsList || [];
            if (settings && !this.hasSettings(settings)) {
                this.settingsList.push(settings);
            }
        }

        removeSettings(settings:AsyncSettings) {
            if (settings) {
                if (this.settingsList) {
                    var index:number = this.settingsList.indexOf(settings);
                    if (index != -1)
                        this.settingsList.splice(index, 1);
                }
            }
        }

        hasSettings(settings:AsyncSettings):bool {
            return settings && this.settingsList && this.settingsList.indexOf(settings) != -1;
        }

        settingsListCount():number {
            return this.settingsList ? this.settingsList.length : 0;
        }

        forEachSettings(callback:(settings:AsyncSettings)=>void) {
            if (this.settingsList && typeof callback === "function") {
                for (var i:number = 0; i < this.settingsList.length; i++) {
                    var settings:AsyncSettings = this.settingsList[i];
                    if (settings)
                        callback(settings);
                }
            }
        }

        removeAllSettings() {
            if (this.settingsList) {
                var toRemove:AsyncSettings[] = this.settingsList.splice(0);
                if (toRemove) {
                    for (var i:number = 0; i < toRemove.length; i++) {
                        this.removeSettings(toRemove[i]);
                    }
                }
            }
        }
    }
}