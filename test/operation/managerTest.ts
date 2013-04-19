///<reference path='../base.ts' />

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
