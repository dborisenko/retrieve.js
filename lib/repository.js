var Retrieve;
(function (Retrieve) {
    var OperationsRepository = (function () {
        function OperationsRepository() {
            this.dictionary = {
            };
        }
        OperationsRepository.prototype.add = function (type, createOperationFunction, settings) {
            if (typeof settings === "undefined") { settings = null; }
            if(this.dictionary && type && createOperationFunction) {
                var item = {
                    type: type,
                    createOperationFunction: createOperationFunction
                };
                if(settings) {
                    item.settings = settings;
                }
                this.dictionary[type] = item;
            }
        };
        OperationsRepository.prototype.remove = function (type) {
            if(this.dictionary && type) {
                delete this.dictionary[type];
            }
        };
        OperationsRepository.prototype.getItem = function (type) {
            var item;
            if(this.dictionary && type) {
                item = this.dictionary[type];
            }
            return item;
        };
        OperationsRepository.prototype.getCreateMethod = function (type) {
            var result;
            var item = this.getItem(type);
            if(item && typeof item.createOperationFunction === "function") {
                result = item.createOperationFunction;
            }
            return result;
        };
        return OperationsRepository;
    })();
    Retrieve.OperationsRepository = OperationsRepository;    
})(Retrieve || (Retrieve = {}));
//@ sourceMappingURL=repository.js.map
