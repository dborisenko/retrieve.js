///<reference path='operation/base.ts' />

module Retrieve
{
    export interface ExecuteSettings {
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
    }
}