///<reference path='../base.ts' />

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
