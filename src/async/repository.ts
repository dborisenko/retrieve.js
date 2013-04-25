///<reference path='operation/base.ts' />

module Retrieve
{
    export interface ExecuteSettings {
        dataHash: (settings:AsyncSettings) => string;
    }

    export interface OperationsRepositoryItem {
        type:string;
        createOperationFunction: (settings:AsyncSettings) => AsyncOperation;
        settings?:ExecuteSettings;
    }

    export class OperationsRepository {
        private dictionary:any = {};

        add(type:string, createOperationFunction: (settings:AsyncSettings) => AsyncOperation, settings:ExecuteSettings = null) {
            if (this.dictionary && type && createOperationFunction) {
                var item:OperationsRepositoryItem = {
                    type: type,
                    createOperationFunction: createOperationFunction,
                };
                if (settings)
                    item.settings = settings;
                this.dictionary[type] = item;
            }
        }

        remove(type:string) {
            if (this.dictionary && type)
                delete this.dictionary[type];
        }

        private getItem(type):OperationsRepositoryItem {
            var item:OperationsRepositoryItem;
            if (this.dictionary && type)
                item = this.dictionary[type];
            return item;
        }

        getCreateMethod(type:string):(settings:AsyncSettings) => AsyncOperation {
            var result:(settings:AsyncSettings) => AsyncOperation;
            var item:OperationsRepositoryItem = this.getItem(type);
            if (item && typeof item.createOperationFunction === "function")
                result = item.createOperationFunction;
            return result;
        }

        getHash(settings:AsyncSettings):string {
            var type:string;
            var result:string;
            if (settings) {
                type = settings.type;
                var item:OperationsRepositoryItem = this.getItem(type);
                if (item && item.settings && typeof item.settings.dataHash === "function")
                    result = item.settings.dataHash(settings);
                else
                    result = this.defaultDataHash(settings);
            }
            return type + "/" + result;
        }

        defaultDataHash(settings:AsyncSettings):string {
            var result:string;
            if (settings) {
                var data:string = "";
                if (typeof settings.data !== "undefined")
                    data = JSON.stringify(settings.data);

                if (data && data !== "")
                    result = data;
            }
            return result;
        }
    }
}