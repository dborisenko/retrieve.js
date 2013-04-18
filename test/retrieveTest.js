var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var _this = this;
var TestSettings = (function () {
    function TestSettings(name, calledCallbacks, type, completeCallback) {
        if (typeof type === "undefined") { type = null; }
        if (typeof completeCallback === "undefined") { completeCallback = null; }
        this.name = name;
        this.calledCallbacks = calledCallbacks;
        this.type = type;
        this.completeCallback = completeCallback;
        this.data = "data";
    }
    TestSettings.prototype.before = function () {
        this.calledCallbacks.push(this.name + ".before");
    };
    TestSettings.prototype.complete = function (data, status) {
        this.calledCallbacks.push(this.name + ".complete[" + status + "]:" + data);
        if(typeof this.completeCallback === "function") {
            this.completeCallback(data, status);
        }
    };
    TestSettings.prototype.success = function (data) {
        this.calledCallbacks.push(this.name + ".success:" + data);
    };
    TestSettings.prototype.error = function (info) {
        this.calledCallbacks.push(this.name + ".error:" + info);
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
        var calledCallbacks = [];
        var operations = [];
        Retrieve.repository.add("testA", function (settings) {
            return new TestOperation(Retrieve.CompleteStatus.success, "resultA", 3000);
        });
        var sc1 = new TestSettings("1.cfgA1", calledCallbacks);
        var sc2 = new TestSettings("1.cfgA2", calledCallbacks);
        var se3 = new TestSettings("1.exeA3", calledCallbacks);
        var se4 = new TestSettings("1.exeA4", calledCallbacks);
        var se5 = new TestSettings("1.exeA5", calledCallbacks);
        var se6 = new TestSettings("1.exeA6", calledCallbacks, "testA");
        var se7 = new TestSettings("2.exeA7", calledCallbacks);
        var manager = Retrieve.manager;
        var retriever1 = Retrieve.retriever();
        retriever1.configure("testA", sc1);
        retriever1.configure("testA", sc2);
        assertTrue(manager.hasSettings(sc1));
        assertTrue(manager.hasSettings(sc2));
        queue.call("Step 1. Execute in the first time", function (callbacks) {
            operations.push(retriever1.retrieve("testA", se3));
            assertTrue(manager.hasSettings(sc1));
            assertTrue(manager.hasSettings(sc2));
            assertFalse(manager.hasSettings(se3));
            var completeCallback = function (data, status) {
                setTimeout(callbacks.add(function () {
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
            setTimeout(callbacks.add(function () {
                se4.type = "testA";
                se4.completeCallback = callbacks.add(completeCallback);
                operations.push(retriever1.retrieve(se4));
                assertTrue(manager.hasSettings(sc1));
                assertTrue(manager.hasSettings(sc2));
                assertFalse(manager.hasSettings(se3));
                assertFalse(manager.hasSettings(se4));
            }), 1000);
        });
        queue.call("Step 2. Executing again the same operation", function (callbacks) {
            operations.push(retriever1.retrieve("testA", se5));
            assertTrue(manager.hasSettings(sc1));
            assertTrue(manager.hasSettings(sc2));
            assertFalse(manager.hasSettings(se5));
            var completeCallback = function (data, status) {
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
            setTimeout(callbacks.add(function () {
                se6.completeCallback = callbacks.add(completeCallback);
                operations.push(retriever1.retrieve(se6));
                assertTrue(manager.hasSettings(sc1));
                assertTrue(manager.hasSettings(sc2));
                assertFalse(manager.hasSettings(se5));
                assertFalse(manager.hasSettings(se6));
            }), 1000);
        });
        queue.call("Step 3. Executing 2nd retriever and dispose 1st retriever", function (callbacks) {
            var retriever2 = Retrieve.retriever();
            se7.completeCallback = callbacks.add(function (data, status) {
                setTimeout(callbacks.add(function () {
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
//@ sourceMappingURL=retrieveTest.js.map
