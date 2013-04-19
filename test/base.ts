///<reference path='../src/retrieve.ts' />

declare var AsyncTestCase, assertEquals, assertTrue, assertFalse;

class TestSettings implements Retrieve.AsyncSettings {
    public data:any = "data";

    constructor(public name:any, private calledCallbacks:string[], public type:string = null, public completeCallback:(data:any, status:string)=>void = null){
    }

    before() {
        this.calledCallbacks.push(this.name + ".before");
    }
    complete(data:any, status:string) {
        this.calledCallbacks.push(this.name + ".complete[" + status + "]:" + data);
        if (typeof this.completeCallback === "function")
            this.completeCallback(data, status);
    }
    success(data:any) {
        this.calledCallbacks.push(this.name + ".success:" + data);
    }
    error (info:any) {
        this.calledCallbacks.push(this.name + ".error:" + info);
    }
}

class TestOperation extends Retrieve.AsyncOperationBase {

    constructor(private status:string, private result:string, private completeTimeout:number) {
        super();
    }

    execute() {
        if (this.completeTimeout == 0) {
            this.complete(this.result, this.status);
        } else if (this.completeTimeout > 0) {
            setTimeout(() => {
                this.complete(this.result, this.status);
            }, this.completeTimeout);
        }
    }
}
