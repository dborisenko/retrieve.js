///<reference path='../signal.ts' />

module Retrieve
{
    export interface CompleteSignal {
        add(callback: (data:any, status:string) => void, context?:any);
        remove(callback: (data:any, status:string) => void, context?:any);
        trigger(data:any, status:string);
    }

    export interface EmptySignal {
        add(callback: () => void, context?:any);
        remove(callback: () => void, context?:any);
        trigger();
    }

    export interface AsyncSettings {
        before?();
        complete?(data:any, status:string);
        success?(data:any);
        error?(info:any);

        type?:string;
        data?:any;
    }

    export interface AsyncOperation {
        completeSignal?:CompleteSignal;

        settings?:AsyncSettings;

        abort?();
        execute();
    }

    export var CompleteStatus = {
        success: "success",
        error: "error",
        timeout: "timeout",
        abort: "abort"
    };

    export class AsyncOperationBase {
        completeSignal:CompleteSignal = new Signal();
        settings:AsyncSettings;

        constructor() {
        }

        complete(data:any, status:string) {
            if (this.completeSignal)
                this.completeSignal.trigger(data, status);
        }

        abort() {
        }

        execute() {
        }
    }
}