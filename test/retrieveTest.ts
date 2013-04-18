/// <reference path="../src/retrieve.ts" />

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
        Retrieve.repository.add("testA", (settings:Retrieve.AsyncSettings):Retrieve.AsyncOperation => {
            return new TestOperation(Retrieve.CompleteStatus.success, "resultA", 3000);
        });

        var sc1:TestSettings = new TestSettings("1.cfgA1", calledCallbacks);
        var sc2:TestSettings = new TestSettings("1.cfgA2", calledCallbacks);
        var se3:TestSettings = new TestSettings("1.exeA3", calledCallbacks);
        var se4:TestSettings = new TestSettings("1.exeA4", calledCallbacks);
        var se5:TestSettings = new TestSettings("1.exeA5", calledCallbacks);
        var se6:TestSettings = new TestSettings("1.exeA6", calledCallbacks, "testA");

        var se7:TestSettings = new TestSettings("2.exeA7", calledCallbacks);

        var manager:Retrieve.OperationsManager = Retrieve.manager;
        var retriever1:Retrieve.RetrieveManager = Retrieve.retriever();
        retriever1.configure("testA", sc1);
        retriever1.configure("testA", sc2);

        assertTrue(manager.hasSettings(sc1));
        assertTrue(manager.hasSettings(sc2));

        queue.call("Step 1. Execute in the first time", (callbacks:{add(callback:(...args:any[])=>void);}) => {
            operations.push(retriever1.retrieve("testA", se3));
            assertTrue(manager.hasSettings(sc1));
            assertTrue(manager.hasSettings(sc2));
            assertFalse(manager.hasSettings(se3));

            var completeCallback = (data:any, status:string) => {
                setTimeout(callbacks.add(() => {
                    assertTrue(manager.hasSettings(sc1));
                    assertTrue(manager.hasSettings(sc2));
                    assertFalse(manager.hasSettings(se3));
                    assertFalse(manager.hasSettings(se4));

                    assertEquals("1.exeA3.before", calledCallbacks[0]);
                    assertEquals("1.cfgA1.before", calledCallbacks[1]);
                    assertEquals("1.cfgA2.before", calledCallbacks[2]);
                    assertEquals("1.exeA4.before", calledCallbacks[3]);
                    assertEquals("1.exeA3.success:resultA", calledCallbacks[4]);
                    assertEquals("1.exeA3.complete[success]:resultA", calledCallbacks[5]);
                    assertEquals("1.cfgA1.success:resultA", calledCallbacks[6]);
                    assertEquals("1.cfgA1.complete[success]:resultA", calledCallbacks[7]);
                    assertEquals("1.cfgA2.success:resultA", calledCallbacks[8]);
                    assertEquals("1.cfgA2.complete[success]:resultA", calledCallbacks[9]);
                    assertEquals("1.exeA4.success:resultA", calledCallbacks[10]);
                    assertEquals("1.exeA4.complete[success]:resultA", calledCallbacks[11]);

                    calledCallbacks.length = 0;
                }), 1000);
            };

            setTimeout(callbacks.add(() => {
                se4.type = "testA";
                se4.completeCallback = callbacks.add(completeCallback);
                operations.push(retriever1.retrieve(se4));

                assertTrue(manager.hasSettings(sc1));
                assertTrue(manager.hasSettings(sc2));
                assertFalse(manager.hasSettings(se3));
                assertFalse(manager.hasSettings(se4));

            }), 1000);
        });

        queue.call("Step 2. Executing again the same operation", (callbacks:{add(callback:(...args:any[])=>void);}) => {
            operations.push(retriever1.retrieve("testA", se5));
            assertTrue(manager.hasSettings(sc1));
            assertTrue(manager.hasSettings(sc2));
            assertFalse(manager.hasSettings(se5));

            var completeCallback = (data:any, status:string) => {
                assertTrue(manager.hasSettings(sc1));
                assertTrue(manager.hasSettings(sc2));
                assertFalse(manager.hasSettings(se5));
                assertFalse(manager.hasSettings(se6));

                assertEquals("1.exeA5.before", calledCallbacks[0]);
                assertEquals("1.cfgA1.before", calledCallbacks[1]);
                assertEquals("1.cfgA2.before", calledCallbacks[2]);
                assertEquals("1.exeA6.before", calledCallbacks[3]);
                assertEquals("1.exeA5.success:resultA", calledCallbacks[4]);
                assertEquals("1.exeA5.complete[success]:resultA", calledCallbacks[5]);
                assertEquals("1.cfgA1.success:resultA", calledCallbacks[6]);
                assertEquals("1.cfgA1.complete[success]:resultA", calledCallbacks[7]);
                assertEquals("1.cfgA2.success:resultA", calledCallbacks[8]);
                assertEquals("1.cfgA2.complete[success]:resultA", calledCallbacks[9]);
                assertEquals("1.exeA6.success:resultA", calledCallbacks[10]);
                assertEquals("1.exeA6.complete[success]:resultA", calledCallbacks[11]);

                calledCallbacks.length = 0;
            };

            setTimeout(callbacks.add(() => {
                se6.completeCallback = callbacks.add(completeCallback);
                operations.push(retriever1.retrieve(se6));
                assertTrue(manager.hasSettings(sc1));
                assertTrue(manager.hasSettings(sc2));
                assertFalse(manager.hasSettings(se5));
                assertFalse(manager.hasSettings(se6));
            }), 1000);
        });

        queue.call("Step 3. Executing 2nd retriever and dispose 1st retriever", (callbacks:{add(callback:(...args:any[])=>void);}) => {
            var retriever2:Retrieve.RetrieveManager = Retrieve.retriever();

            se7.completeCallback = callbacks.add((data:any, status:string) => {
                setTimeout(callbacks.add(() => {

                    assertFalse(manager.hasSettings(sc1));
                    assertFalse(manager.hasSettings(sc2));
                    assertFalse(manager.hasSettings(se7));

                    assertEquals("2.exeA7.before", calledCallbacks[0]);
                    assertEquals("1.cfgA1.before", calledCallbacks[1]);
                    assertEquals("1.cfgA2.before", calledCallbacks[2]);
                    assertEquals("1.cfgA1.complete[abort]:null", calledCallbacks[3]);
                    assertEquals("1.cfgA2.complete[abort]:null", calledCallbacks[4]);
                    assertEquals("2.exeA7.success:resultA", calledCallbacks[5]);
                    assertEquals("2.exeA7.complete[success]:resultA", calledCallbacks[6]);

                    calledCallbacks.length = 0;
                }), 1000);
            });

            operations.push(retriever2.retrieve("testA", se7));

            retriever1.dispose();
        });
    }
});