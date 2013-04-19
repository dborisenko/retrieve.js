var Retrieve;
(function (Retrieve) {
    var RetrieveOperationManager = (function () {
        function RetrieveOperationManager(manager) {
            this.manager = manager;
            this.settingsList = [];
        }
        RetrieveOperationManager.prototype.prepareSettings = function (typeOrSettings, settings) {
            settings = settings || (typeof typeOrSettings === "object" ? typeOrSettings : undefined) || {
            };
            if(!settings.type && typeof typeOrSettings === "string") {
                settings.type = typeOrSettings;
            }
            return settings;
        };
        RetrieveOperationManager.prototype.addSettings = function (typeOrSettings, settings) {
            this.settingsList = this.settingsList || [];
            settings = this.prepareSettings(typeOrSettings, settings);
            if(settings) {
                if(this.settingsList.indexOf(settings) == -1) {
                    this.settingsList.push(settings);
                }
                if(this.manager) {
                    this.manager.addSettings(settings);
                }
            }
        };
        RetrieveOperationManager.prototype.removeSettings = function (typeOrSettings, settings) {
            settings = this.prepareSettings(typeOrSettings, settings);
            if(settings) {
                if(this.settingsList) {
                    var index = this.settingsList.indexOf(settings);
                    if(index != -1) {
                        this.settingsList.splice(index, 1);
                    }
                }
                if(this.manager) {
                    this.manager.removeSettings(settings);
                }
            }
        };
        RetrieveOperationManager.prototype.removeAllSettings = function () {
            if(this.settingsList) {
                var toRemove = this.settingsList.slice(0);
                for(var i = 0; i < toRemove.length; i++) {
                    this.removeSettings(toRemove[i]);
                }
            }
        };
        RetrieveOperationManager.prototype.execute = function (typeOrSettings, settings) {
            settings = this.prepareSettings(typeOrSettings, settings);
            return this.manager.execute(settings);
        };
        RetrieveOperationManager.prototype.configure = function (typeOrSettings, settings) {
            this.addSettings(typeOrSettings, settings);
        };
        RetrieveOperationManager.prototype.retrieve = function (typeOrSettings, settings) {
            return this.execute(typeOrSettings, settings);
        };
        RetrieveOperationManager.prototype.dispose = function () {
            this.removeAllSettings();
        };
        return RetrieveOperationManager;
    })();    
    Retrieve.repository = new Retrieve.OperationsRepository();
    Retrieve.manager = new Retrieve.OperationsManager(Retrieve.repository);
    function retriever() {
        return new RetrieveOperationManager(Retrieve.manager);
    }
    Retrieve.retriever = retriever;
})(Retrieve || (Retrieve = {}));
//@ sourceMappingURL=retrieve.js.map
