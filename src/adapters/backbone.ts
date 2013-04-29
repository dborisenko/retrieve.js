///<reference path='../async/operation/base.ts' />

declare module Backbone {
    export class Model {
        constructor (attr? , opts? );
        get(name: string): any;
        set(name: string, val: any): void;
        set(obj: any): void;
        save(attr? , opts? ): void;
        destroy(): void;
        bind(ev: string, f: Function, ctx?: any): void;
        toJSON(): any;
    }
    export class Collection {
        constructor (models? , opts? );
        bind(ev: string, f: Function, ctx?: any): void;
        length: number;
        create(attrs, opts? ): any;
        each(f: (elem: any) => void ): void;
        fetch(opts?: any): void;
        last(): any;
        last(n: number): any[];
        filter(f: (elem: any) => any): any[];
        without(...values: any[]): any[];
        reset(models?: any, options?:any);
    }
}

module Retrieve {
    export class BackboneAdapter extends AsyncSettingsBase {

        private model:any;
        private proxiedSettings:AsyncSettings;

        data:any;
        type:string;

        constructor(model:Backbone.Model);
        constructor(collection:Backbone.Collection);

        constructor(model:Backbone.Model, type:string);
        constructor(collection:Backbone.Collection, type:string);

        constructor(model:Backbone.Model, proxiedSettings:AsyncSettings);
        constructor(collection:Backbone.Collection, proxiedSettings:AsyncSettings);

        constructor(model:Backbone.Model, type:string, proxiedSettings:AsyncSettings);
        constructor(collection:Backbone.Collection, type:string, proxiedSettings:AsyncSettings);

        constructor(model:Backbone.Model, type:string, data:any, proxiedSettings:AsyncSettings);
        constructor(collection:Backbone.Collection, type:string, data:any, proxiedSettings:AsyncSettings);

        constructor(modelOrCollection:any, typeOrProxiedSettings:any = null, dataOrProxiedSettings:any = null, proxiedSettings:AsyncSettings = null) {
            super();
            this.model = modelOrCollection;

            this.proxiedSettings = proxiedSettings || dataOrProxiedSettings || (typeof typeOrProxiedSettings !== "string" ? typeOrProxiedSettings : null);
            if (typeof typeOrProxiedSettings === "string")
                this.type = typeOrProxiedSettings;
            if (proxiedSettings && dataOrProxiedSettings)
                this.data = dataOrProxiedSettings;

            if (this.completeSignal)
                this.completeSignal.add(this.onComplete, this);
        }

        private onComplete(data:any, status:string) {
            if (status == CompleteStatus.success && this.model) {
                if (typeof (<Backbone.Collection>this.model).reset === "function")
                    this.model.reset(data);
                else if (typeof (<Backbone.Model>this.model).save === "function")
                    this.model.save(data);
            }
        }

        before() {
            if (this.proxiedSettings && typeof this.proxiedSettings.before === "function")
                this.proxiedSettings.before();
        }

        complete(data:any, status:string) {
            if (this.proxiedSettings && typeof this.proxiedSettings.complete === "function")
                this.proxiedSettings.complete(data, status);
        }

        success(data:any) {
            if (this.proxiedSettings && typeof this.proxiedSettings.success === "function")
                this.proxiedSettings.success(data);
        }

        error(info:any) {
            if (this.proxiedSettings && typeof this.proxiedSettings.error === "function")
                this.proxiedSettings.error(info);
        }
    }
}