///<reference path='base.ts' />

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

        var manager:Retrieve.AsyncInvoker = Retrieve.manager;
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
    },
    "testConfigure": (queue:{call(msg:string, callback:(callbacks:any) => void);}) => {
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

        var manager:Retrieve.AsyncInvoker = Retrieve.manager;
        var invoker1:Retrieve.RetrieveInvoker = Retrieve.configure("testA", sc1);
        invoker1.addSettings(sc2);

        assertTrue(manager.hasSettings(sc1));
        assertTrue(manager.hasSettings(sc2));

        queue.call("Step 1. Execute in the first time", (callbacks:{add(callback:(...args:any[])=>void);}) => {
            operations.push(invoker1.retrieve(se3));
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
                operations.push(invoker1.retrieve(se4));

                assertTrue(manager.hasSettings(sc1));
                assertTrue(manager.hasSettings(sc2));
                assertFalse(manager.hasSettings(se3));
                assertFalse(manager.hasSettings(se4));

            }), 1000);
        });

        queue.call("Step 2. Executing again the same operation", (callbacks:{add(callback:(...args:any[])=>void);}) => {
            operations.push(invoker1.retrieve(se5));
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
                operations.push(invoker1.retrieve(se6));
                assertTrue(manager.hasSettings(sc1));
                assertTrue(manager.hasSettings(sc2));
                assertFalse(manager.hasSettings(se5));
                assertFalse(manager.hasSettings(se6));
            }), 1000);
        });

        queue.call("Step 3. Executing 2nd retriever and dispose 1st retriever", (callbacks:{add(callback:(...args:any[])=>void);}) => {
            var invoker2:Retrieve.RetrieveInvoker = Retrieve.configure("testA", se7);

            se7.completeCallback = callbacks.add((data:any, status:string) => {
                setTimeout(callbacks.add(() => {

                    assertFalse(manager.hasSettings(sc1));
                    assertFalse(manager.hasSettings(sc2));
                    assertTrue(manager.hasSettings(se7));

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

            operations.push(invoker2.retrieve());

            invoker1.dispose();
        });
    }
});