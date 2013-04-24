///<reference path='operation/base.ts' />

module Retrieve
{
    export interface RetrieveOperation extends AsyncOperation {
        retrieve();
    }

    export interface RetrieveMultiOperation extends RetrieveOperation, AsyncMultiOperation {
        retrieve(settings?:AsyncSettings);
    }

    export interface RetrieveManager {
        configure(type:string, settings:AsyncSettings):RetrieveOperation;
        configure(settings:AsyncSettings):RetrieveOperation;

        unconfigure(type:string, settings:AsyncSettings);
        unconfigure(settings:AsyncSettings);

        dispose();

        retrieve(type:string, settings:AsyncSettings):RetrieveOperation;
        retrieve(settings:AsyncSettings):RetrieveOperation;
        retrieve(type:string):RetrieveOperation;
    }
}
