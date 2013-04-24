///<reference path='async/operation/base.ts' />
///<reference path='async/invoker/base.ts' />

module Retrieve
{
    export interface RetrieveOperation extends AsyncOperation {
        retrieve();
    }

    export interface RetrieveMultiOperation extends RetrieveOperation, AsyncMultiOperation {
        retrieve(settings?:AsyncSettings);
    }

    export interface RetrieveInvoker extends AsyncInvoker {
        retrieve(settings?:AsyncSettings):RetrieveOperation;

        dispose();
    }

    export interface RetrieveManager {
        configure(type:string, settings:AsyncSettings):RetrieveInvoker;
        configure(settings:AsyncSettings):RetrieveInvoker;

        unconfigure(type:string, settings:AsyncSettings);
        unconfigure(settings:AsyncSettings);

        dispose();

        retrieve(type:string, settings:AsyncSettings):RetrieveOperation;
        retrieve(settings:AsyncSettings):RetrieveOperation;
        retrieve(type:string):RetrieveOperation;
    }
}
