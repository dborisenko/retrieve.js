var Retrieve;
(function (Retrieve) {
    var OperationsManager = (function () {
        function OperationsManager(repository) {
            this.repository = repository;
            this.managers = {
            };
        }
        OperationsManager.prototype.getManager = function (settings, createNewManager) {
            if (typeof createNewManager === "undefined") { createNewManager = true; }
            var hash = this.hash(settings);
            var manager = this.managers[hash];
            if(!manager && createNewManager) {
                manager = new Retrieve.AsyncOperationManager(this.repository.getCreateMethod(settings.type));
                this.managers[hash] = manager;
            }
            return manager;
        };
        OperationsManager.prototype.addSettings = function (settings) {
            var manager = this.getManager(settings, true);
            if(manager) {
                manager.addSettings(settings);
            }
        };
        OperationsManager.prototype.hasSettings = function (settings) {
            var manager = this.getManager(settings, false);
            return settings && manager && manager.hasSettings(settings);
        };
        OperationsManager.prototype.removeSettings = function (settings) {
            var manager = this.getManager(settings, false);
            if(manager) {
                manager.removeSettings(settings);
            }
            this.cleanupManager(settings, manager);
        };
        OperationsManager.prototype.execute = function (settings) {
            var result;
            var manager = this.getManager(settings, false);
            if(manager) {
                result = manager.execute(settings);
            }
            return result;
        };
        OperationsManager.prototype.hash = function (settings) {
            var result;
            if(settings) {
                var type = "";
                if(typeof settings.type !== "undefined") {
                    type = settings.type;
                }
                var data = "";
                if(typeof settings.data !== "undefined") {
                    data = JSON.stringify(settings.data);
                }
                if(type && type !== "" && data && data !== "") {
                    result = type + "/" + data;
                }
            }
            return result;
        };
        OperationsManager.prototype.cleanupManager = function (settings, manager) {
            if (typeof manager === "undefined") { manager = null; }
            if(!manager) {
                manager = this.getManager(settings, false);
            }
            if(manager && !manager.isInProgress() && manager.settingsListCount() === 0) {
                var hash = this.hash(settings);
                delete this.managers[hash];
            }
        };
        return OperationsManager;
    })();
    Retrieve.OperationsManager = OperationsManager;    
})(Retrieve || (Retrieve = {}));
//@ sourceMappingURL=manager.js.map
