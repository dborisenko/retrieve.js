/// <reference path="../src/retrieve.ts" />

declare var AsyncTestCase, assertEquals;
declare var fail: (msg)=>void;

class TestSettings implements Retrieve.AsyncSettings {
    constructor(public data:any, private calledCallbacks:string[], public type:string = null, private completeCallback:(data:any, status:string)=>void = null){
    }

    before() {
        this.calledCallbacks.push(this.data + ".before");
    }
    complete(data:any, status:string) {
        this.calledCallbacks.push(this.data + ".complete[" + status + "]:" + data);
        if (typeof this.completeCallback === "function")
            this.completeCallback(data, status);
    }
    success(data:any) {
        this.calledCallbacks.push(this.data + ".success:" + data);
    }
    error (info:any) {
        this.calledCallbacks.push(this.data + ".error:" + info);
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

AsyncTestCase("AsyncOperationExecutorTest", {
    "testSuccessCallbacks": () => {
        var calledCallbacks:string[] = [];
        var operation:Retrieve.AsyncOperation = new TestOperation(Retrieve.CompleteStatus.success, "result", 0);
        var executor:Retrieve.AsyncOperationExecutor = new Retrieve.AsyncOperationExecutor(operation, new TestSettings(1, calledCallbacks));
        executor.addSettings(new TestSettings(2, calledCallbacks));

        assertEquals(0, calledCallbacks.length);
        executor.execute();
        assertEquals(6, calledCallbacks.length);
        assertEquals("1.before", calledCallbacks[0]);
        assertEquals("2.before", calledCallbacks[1]);
        assertEquals("1.success:result", calledCallbacks[2]);
        assertEquals("1.complete[success]:result", calledCallbacks[3]);
        assertEquals("2.success:result", calledCallbacks[4]);
        assertEquals("2.complete[success]:result", calledCallbacks[5]);
    },

    "testErrorCallbacks": () => {
        var calledCallbacks:string[] = [];
        var operation:Retrieve.AsyncOperation = new TestOperation(Retrieve.CompleteStatus.error, "fault", 0);
        var executor:Retrieve.AsyncOperationExecutor = new Retrieve.AsyncOperationExecutor(operation, new TestSettings(1, calledCallbacks));
        executor.addSettings(new TestSettings(2, calledCallbacks));

        assertEquals(0, calledCallbacks.length);
        executor.execute();
        assertEquals(6, calledCallbacks.length);
        assertEquals("1.before", calledCallbacks[0]);
        assertEquals("2.before", calledCallbacks[1]);
        assertEquals("1.error:fault", calledCallbacks[2]);
        assertEquals("1.complete[error]:fault", calledCallbacks[3]);
        assertEquals("2.error:fault", calledCallbacks[4]);
        assertEquals("2.complete[error]:fault", calledCallbacks[5]);
    },

    "testTimeoutCallback": (queue:{call(msg:string, callback:(callbacks:any) => void);}) => {
        var calledCallbacks:string[] = [];
        var operation:Retrieve.AsyncOperation = new TestOperation(Retrieve.CompleteStatus.error, "fault", -1);
        var executor:Retrieve.AsyncOperationExecutor = new Retrieve.AsyncOperationExecutor(operation, new TestSettings(1, calledCallbacks));
        executor.addSettings(new TestSettings(2, calledCallbacks));

        queue.call("Waiting for a timeout", (callbacks:{add(callback:(...args:any[])=>void);}) => {
            assertEquals(0, calledCallbacks.length);

            executor.completeSignal.add(callbacks.add((data:any, status:string) => {
                assertEquals(Retrieve.CompleteStatus.timeout, status);
            }), this);

            executor.execute();
            assertEquals(2, calledCallbacks.length);
            assertEquals("1.before", calledCallbacks[0]);
            assertEquals("2.before", calledCallbacks[1]);
        });
    },

    "testAbortCallback": () => {
        var calledCallbacks:string[] = [];
        var operation:Retrieve.AsyncOperation = new TestOperation(Retrieve.CompleteStatus.success, "result", 8000);
        var executor:Retrieve.AsyncOperationExecutor = new Retrieve.AsyncOperationExecutor(operation, new TestSettings(1, calledCallbacks));
        executor.addSettings(new TestSettings(2, calledCallbacks));

        assertEquals(0, calledCallbacks.length);
        executor.execute();
        assertEquals(2, calledCallbacks.length);
        assertEquals("1.before", calledCallbacks[0]);
        assertEquals("2.before", calledCallbacks[1]);

        executor.abort();
        assertEquals(4, calledCallbacks.length);
        assertEquals("1.complete[abort]:null", calledCallbacks[2]);
        assertEquals("2.complete[abort]:null", calledCallbacks[3]);
    },

    "testAbortOnRemoveAllSettings": () => {
        var calledCallbacks:string[] = [];
        var settings1:Retrieve.AsyncSettings = new TestSettings(1, calledCallbacks);
        var settings2:Retrieve.AsyncSettings = new TestSettings(2, calledCallbacks);
        var operation:Retrieve.AsyncOperation = new TestOperation(Retrieve.CompleteStatus.success, "result", 8000);
        var executor:Retrieve.AsyncOperationExecutor = new Retrieve.AsyncOperationExecutor(operation, settings1);
        executor.addSettings(settings2);

        executor.completeSignal.add((data:any, status:string) => {
            assertEquals(Retrieve.CompleteStatus.abort, status);
            calledCallbacks.push("executor.complete[" + status + "]:" + data);
        }, this);

        assertEquals(0, calledCallbacks.length);
        executor.execute();
        assertEquals(2, calledCallbacks.length);
        assertEquals("1.before", calledCallbacks[0]);
        assertEquals("2.before", calledCallbacks[1]);

        executor.removeSettings(settings2);
        assertEquals(3, calledCallbacks.length);
        assertEquals("2.complete[abort]:null", calledCallbacks[2]);

        executor.removeSettings(settings1);
        assertEquals(5, calledCallbacks.length);
        assertEquals("1.complete[abort]:null", calledCallbacks[3]);
        assertEquals("executor.complete[abort]:null", calledCallbacks[4]);
    },

    "testAddSettingsInTheMiddleOfLoading": (queue:{call(msg:string, callback:(callbacks:any) => void);}) => {
        var calledCallbacks:string[] = [];
        var operation:Retrieve.AsyncOperation = new TestOperation(Retrieve.CompleteStatus.success, "result", 3000);
        var executor:Retrieve.AsyncOperationExecutor = new Retrieve.AsyncOperationExecutor(operation, new TestSettings(1, calledCallbacks));
        executor.addSettings(new TestSettings(2, calledCallbacks));

        queue.call("Waiting for a timeout", (callbacks:{add(callback:(...args:any[])=>void);}) => {
            assertEquals(0, calledCallbacks.length);

            setTimeout(callbacks.add(() => {
                executor.addSettings(new TestSettings(3, calledCallbacks));
                assertEquals(3, calledCallbacks.length);
                assertEquals("3.before", calledCallbacks[2]);
            }), 1000);

            executor.completeSignal.add(callbacks.add((data:any, status:string) => {
                assertEquals(9, calledCallbacks.length);
                assertEquals("1.success:result", calledCallbacks[3]);
                assertEquals("1.complete[success]:result", calledCallbacks[4]);
                assertEquals("2.success:result", calledCallbacks[5]);
                assertEquals("2.complete[success]:result", calledCallbacks[6]);
                assertEquals("3.success:result", calledCallbacks[7]);
                assertEquals("3.complete[success]:result", calledCallbacks[8]);
            }), this);

            executor.execute();
            assertEquals(2, calledCallbacks.length);
            assertEquals("1.before", calledCallbacks[0]);
            assertEquals("2.before", calledCallbacks[1]);
        });
    }
});

AsyncTestCase("AsyncOperationManagerTest", {
    "testSettingsCallbacks": (queue:{call(msg:string, callback:(callbacks:any) => void);}) => {
        var manager:Retrieve.AsyncOperationManager = new Retrieve.AsyncOperationManager((settings:Retrieve.AsyncSettings):Retrieve.AsyncOperation => {
            return new TestOperation(Retrieve.CompleteStatus.success, "result", 3000);
        });

        var calledCallbacks:string[] = [];
        var settings1:Retrieve.AsyncSettings = new TestSettings(1, calledCallbacks);
        var settings2:Retrieve.AsyncSettings = new TestSettings(2, calledCallbacks);
        var settingsExecute1:Retrieve.AsyncSettings = new TestSettings("execute1", calledCallbacks);
        var settingsExecute2:Retrieve.AsyncSettings = new TestSettings("execute2", calledCallbacks);

        manager.addSettings(settings1);

        queue.call("Main execute", (callbacks:{add(callback:(...args:any[])=>void);}) => {

            setTimeout(callbacks.add(() => {
                manager.addSettings(settings2);
            }), 1000);

            setTimeout(callbacks.add(() => {
                manager.execute(settingsExecute2)
            }), 2000);

            manager.completeSignal.add(callbacks.add((data:any, status:string) => {
                assertEquals(12, calledCallbacks.length);
                assertEquals("execute1.before", calledCallbacks[0]);
                assertEquals("1.before", calledCallbacks[1]);
                assertEquals("2.before", calledCallbacks[2]);
                assertEquals("execute2.before", calledCallbacks[3]);

                assertEquals("execute1.success:result", calledCallbacks[4]);
                assertEquals("execute1.complete[success]:result", calledCallbacks[5]);
                assertEquals("1.success:result", calledCallbacks[6]);
                assertEquals("1.complete[success]:result", calledCallbacks[7]);
                assertEquals("2.success:result", calledCallbacks[8]);
                assertEquals("2.complete[success]:result", calledCallbacks[9]);
                assertEquals("execute2.success:result", calledCallbacks[10]);
                assertEquals("execute2.complete[success]:result", calledCallbacks[11]);
            }), this);

            manager.execute(settingsExecute1);
        });
    },

    "testAbort": (queue:{call(msg:string, callback:(callbacks:any) => void);}) => {
        var manager:Retrieve.AsyncOperationManager = new Retrieve.AsyncOperationManager((settings:Retrieve.AsyncSettings):Retrieve.AsyncOperation => {
            return new TestOperation(Retrieve.CompleteStatus.success, "result", 8000);
        });

        var calledCallbacks:string[] = [];
        var settingsExecute1:Retrieve.AsyncSettings = new TestSettings("execute1", calledCallbacks);
        var settingsExecute2:Retrieve.AsyncSettings = new TestSettings("execute2", calledCallbacks);
        var operations:Retrieve.AsyncOperation[] = [];

        queue.call("Main execute", (callbacks:{add(callback:(...args:any[])=>void);}) => {

            setTimeout(callbacks.add(() => {
                operations.push(manager.execute(settingsExecute2));
                assertEquals(2, calledCallbacks.length);
                assertEquals("execute2.before", calledCallbacks[1]);
            }), 1000);

            setTimeout(callbacks.add(() => {
                operations[0].abort();
                assertEquals(3, calledCallbacks.length);
                assertEquals("execute1.complete[abort]:null", calledCallbacks[2]);
            }), 2000);

            setTimeout(callbacks.add(() => {
                operations[1].abort();
                assertEquals(4, calledCallbacks.length);
                assertEquals("execute2.complete[abort]:null", calledCallbacks[3]);
            }), 3000);

            manager.completeSignal.add(callbacks.add((data:any, status:string) => {
                assertEquals(4, calledCallbacks.length);
                assertEquals(Retrieve.CompleteStatus.abort, status);
            }), this);

            operations.push(manager.execute(settingsExecute1));
            assertEquals(1, calledCallbacks.length);
            assertEquals("execute1.before", calledCallbacks[0]);
        });
    }
});

AsyncTestCase("RetrieveTest", {
    "testRetrieve": (queue:{call(msg:string, callback:(callbacks:any) => void);}) => {
        var calledCallbacks:string[] = [];
        var operations:Retrieve.AsyncOperation[] = [];
        Retrieve.repository.add("testA", (settings:Retrieve.AsyncSettings):Retrieve.AsyncOperation {
            return new TestOperation(Retrieve.CompleteStatus.success, "resultA", 5000);
        });

        var retriever1:Retrieve.RetrieveManager = Retrieve.retriever();
        retriever1.configure("testA", new TestSettings("1.cfgA1", calledCallbacks));
        retriever1.configure("testA", new TestSettings("1.cfgA2", calledCallbacks));

        var retriever2:Retrieve.RetrieveManager = Retrieve.retriever();
        retriever1.configure("testA", new TestSettings("2.cfgA1", calledCallbacks));
        retriever1.configure("testA", new TestSettings("2.cfgA2", calledCallbacks));

        queue.call("Step 1. Execute in the first time", (callbacks:{add(callback:(...args:any[])=>void);}) => {
            operations.push(retriever1.retrieve("testA", new TestSettings("1.rtrA1", calledCallbacks)));
            //

            var completeCallback = (data:any, status:string) => {
                //
            };

            setTimeout(callbacks.add(() => {
                operations.push(retriever1.retrieve(new TestSettings("1.rtrA2", calledCallbacks, "testA", callbacks.add(completeCallback))));
                //
            }), 1000);
        });

        queue.call("Step 2. Executing again the same operation", (callbacks:{add(callback:(...args:any[])=>void);}) => {
            operations.push(retriever1.retrieve("testA", new TestSettings("1.rtrA1", calledCallbacks)));
            //

            var completeCallback = (data:any, status:string) => {
                //
            };

            setTimeout(callbacks.add(() => {
                operations.push(retriever1.retrieve(new TestSettings("1.rtrA2", calledCallbacks, "testA", callbacks.add(completeCallback))));
                //
            }), 1000);
        });
    }
});