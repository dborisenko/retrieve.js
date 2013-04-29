///<reference path='../../signal.ts' />

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
        beforeSignal?:EmptySignal;
        completeSignal?:CompleteSignal;

        settings?:AsyncSettings;

        abort?();
        execute();
    }

    export interface AsyncMultiOperation extends AsyncOperation {
        addSettings(settings:AsyncSettings);
        removeSettings(settings:AsyncSettings);

        execute(settings?:AsyncSettings);
    }

    export var CompleteStatus = {
        success: "success",
        error: "error",
        timeout: "timeout",
        abort: "abort"
    };

    export class AsyncSettingsBase implements AsyncSettings {
        beforeSignal:EmptySignal = new Signal();
        completeSignal:CompleteSignal = new Signal();

        constructor() {
        }

        complete(data:any, status:string) {
            if (this.completeSignal)
                this.completeSignal.trigger(data, status);
        }

        before() {
            if (this.beforeSignal)
                this.beforeSignal.trigger();
        }
    }

    export class AsyncOperationBase implements AsyncOperation {
        beforeSignal:EmptySignal = new Signal();
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