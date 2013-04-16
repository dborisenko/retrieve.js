var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var _this = this;
var TestSettings = (function () {
    function TestSettings(data, calledCallbacks) {
        this.data = data;
        this.calledCallbacks = calledCallbacks;
    }
    TestSettings.prototype.before = function () {
        this.calledCallbacks.push(this.data + ".before");
    };
    TestSettings.prototype.complete = function (data, status) {
        this.calledCallbacks.push(this.data + ".complete[" + status + "]:" + data);
    };
    TestSettings.prototype.success = function (data) {
        this.calledCallbacks.push(this.data + ".success:" + data);
    };
    TestSettings.prototype.error = function (info) {
        this.calledCallbacks.push(this.data + ".error:" + info);
    };
    return TestSettings;
})();
var TestOperation = (function (_super) {
    __extends(TestOperation, _super);
    function TestOperation(status, result, completeTimeout) {
        _super.call(this);
        this.status = status;
        this.result = result;
        this.completeTimeout = completeTimeout;
    }
    TestOperation.prototype.execute = function () {
        var _this = this;
        if(this.completeTimeout == 0) {
            this.complete(this.result, this.status);
        } else if(this.completeTimeout > 0) {
            setTimeout(function () {
                _this.complete(_this.result, _this.status);
            }, this.completeTimeout);
        }
    };
    return TestOperation;
})(Retrieve.AsyncOperationBase);
AsyncTestCase("AsyncOperationExecutorTest", {
    "testSuccessCallbacks": function () {
        var calledCallbacks = [];
        var operation = new TestOperation(Retrieve.CompleteStatus.success, "result", 0);
        var executor = new Retrieve.AsyncOperationExecutor(operation, new TestSettings(1, calledCallbacks));
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
    "testErrorCallbacks": function () {
        var calledCallbacks = [];
        var operation = new TestOperation(Retrieve.CompleteStatus.error, "fault", 0);
        var executor = new Retrieve.AsyncOperationExecutor(operation, new TestSettings(1, calledCallbacks));
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
    "testTimeoutCallback": function (queue) {
        var _this = this;
        var calledCallbacks = [];
        var operation = new TestOperation(Retrieve.CompleteStatus.error, "fault", -1);
        var executor = new Retrieve.AsyncOperationExecutor(operation, new TestSettings(1, calledCallbacks));
        executor.addSettings(new TestSettings(2, calledCallbacks));
        queue.call("Waiting for a timeout", function (callbacks) {
            assertEquals(0, calledCallbacks.length);
            executor.completeSignal.add(callbacks.add(function (data, status) {
                assertEquals(Retrieve.CompleteStatus.timeout, status);
            }), _this);
            executor.execute();
            assertEquals(2, calledCallbacks.length);
            assertEquals("1.before", calledCallbacks[0]);
            assertEquals("2.before", calledCallbacks[1]);
        });
    },
    "testAbortCallback": function () {
        var calledCallbacks = [];
        var operation = new TestOperation(Retrieve.CompleteStatus.success, "result", 8000);
        var executor = new Retrieve.AsyncOperationExecutor(operation, new TestSettings(1, calledCallbacks));
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
    "testAbortOnRemoveAllSettings": function () {
        var calledCallbacks = [];
        var settings1 = new TestSettings(1, calledCallbacks);
        var settings2 = new TestSettings(2, calledCallbacks);
        var operation = new TestOperation(Retrieve.CompleteStatus.success, "result", 8000);
        var executor = new Retrieve.AsyncOperationExecutor(operation, settings1);
        executor.addSettings(settings2);
        executor.completeSignal.add(function (data, status) {
            assertEquals(Retrieve.CompleteStatus.abort, status);
            calledCallbacks.push("executor.complete[" + status + "]:" + data);
        }, _this);
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
    "testAddSettingsInTheMiddleOfLoading": function (queue) {
        var _this = this;
        var calledCallbacks = [];
        var operation = new TestOperation(Retrieve.CompleteStatus.success, "result", 3000);
        var executor = new Retrieve.AsyncOperationExecutor(operation, new TestSettings(1, calledCallbacks));
        executor.addSettings(new TestSettings(2, calledCallbacks));
        queue.call("Waiting for a timeout", function (callbacks) {
            assertEquals(0, calledCallbacks.length);
            setTimeout(callbacks.add(function () {
                executor.addSettings(new TestSettings(3, calledCallbacks));
                assertEquals(3, calledCallbacks.length);
                assertEquals("3.before", calledCallbacks[2]);
            }), 1000);
            executor.completeSignal.add(callbacks.add(function (data, status) {
                assertEquals(9, calledCallbacks.length);
                assertEquals("1.success:result", calledCallbacks[3]);
                assertEquals("1.complete[success]:result", calledCallbacks[4]);
                assertEquals("2.success:result", calledCallbacks[5]);
                assertEquals("2.complete[success]:result", calledCallbacks[6]);
                assertEquals("3.success:result", calledCallbacks[7]);
                assertEquals("3.complete[success]:result", calledCallbacks[8]);
            }), _this);
            executor.execute();
            assertEquals(2, calledCallbacks.length);
            assertEquals("1.before", calledCallbacks[0]);
            assertEquals("2.before", calledCallbacks[1]);
        });
    }
});
AsyncTestCase("AsyncOperationManagerTest", {
    "testSettingsCallbacks": function (queue) {
        var _this = this;
        var manager = new Retrieve.AsyncOperationManager(function (settings) {
            return new TestOperation(Retrieve.CompleteStatus.success, "result", 3000);
        });
        var calledCallbacks = [];
        var settings1 = new TestSettings(1, calledCallbacks);
        var settings2 = new TestSettings(2, calledCallbacks);
        var settingsExecute1 = new TestSettings("execute1", calledCallbacks);
        var settingsExecute2 = new TestSettings("execute2", calledCallbacks);
        manager.addSettings(settings1);
        queue.call("Main execute", function (callbacks) {
            setTimeout(callbacks.add(function () {
                manager.addSettings(settings2);
            }), 1000);
            setTimeout(callbacks.add(function () {
                manager.execute(settingsExecute2);
            }), 2000);
            manager.completeSignal.add(callbacks.add(function (data, status) {
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
            }), _this);
            manager.execute(settingsExecute1);
        });
    },
    "testAbort": function (queue) {
        var _this = this;
        var manager = new Retrieve.AsyncOperationManager(function (settings) {
            return new TestOperation(Retrieve.CompleteStatus.success, "result", 8000);
        });
        var calledCallbacks = [];
        var settingsExecute1 = new TestSettings("execute1", calledCallbacks);
        var settingsExecute2 = new TestSettings("execute2", calledCallbacks);
        var operations = [];
        queue.call("Main execute", function (callbacks) {
            setTimeout(callbacks.add(function () {
                operations.push(manager.execute(settingsExecute2));
                assertEquals(2, calledCallbacks.length);
                assertEquals("execute2.before", calledCallbacks[1]);
            }), 1000);
            setTimeout(callbacks.add(function () {
                operations[0].abort();
                assertEquals(3, calledCallbacks.length);
                assertEquals("execute1.complete[abort]:null", calledCallbacks[2]);
            }), 2000);
            setTimeout(callbacks.add(function () {
                operations[1].abort();
                assertEquals(4, calledCallbacks.length);
                assertEquals("execute2.complete[abort]:null", calledCallbacks[3]);
            }), 3000);
            manager.completeSignal.add(callbacks.add(function (data, status) {
                assertEquals(4, calledCallbacks.length);
                assertEquals(Retrieve.CompleteStatus.abort, status);
            }), _this);
            operations.push(manager.execute(settingsExecute1));
            assertEquals(1, calledCallbacks.length);
            assertEquals("execute1.before", calledCallbacks[0]);
        });
    }
});
AsyncTestCase("RetrieveTest", {
    "testRetrieve": function (queue) {
        Retrieve.repository.add("testOperation");
        var retrieve = Retrieve.retriever();
        retrieve.configure("");
    }
});
//@ sourceMappingURL=retrieveTest.js.map
