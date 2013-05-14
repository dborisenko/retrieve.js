retrieve.js
===========

##Example

###Configuring commands repository 

    Retrieve.repository.add('getResult', function (settings) {
      var completeSignal = new Retrieve.Signal();
      var result = [];
      for (var i = 0; i < count; i++)
            result.push({id: i, title: 'result-for-' + settings.data + '/' + i});
        return {
          completeSignal: completeSignal,
          execute: function () {
            // Retrieve result, based on settings.data
            setTimeout(function () {
              completeSignal.trigger(result, Retrieve.CompleteStatus.success);
            }, 1000);
          },
          abort: function () {
            result = null;
          }
        };
    });

###Usage in Backbone.js

    var ViewComponent = Backbone.View.extend({
      r: null,
      result: null,
      loadStatus: 'uninitialized',
      op: null,
      
      events: {
        'click .retrieve-result': 'retrieveResult',
        'click .abort-retrieve': 'abortRetrieve'
      },
      
      retrieveResult: function () {
        if (this.r)
          this.op = this.r.retrieve();
      },
      
      abortRetrieve: function () {
        if (this.op)
          this.op.abort();
      },
      
      initialize: function () {
        var _this = this;
        this.r = Retrieve.configure('getResult', {
          data: 'id123',
          before: function () {
            _this.loadStatus = 'loading';
          },
          complete: function (result, status) {
            _this.result = result;
            _this.loadStatus = (status === 'success' && data ? 'success' : 'error');
            _this.render();
          }
        });
        this.render();
      },
      
      render: function () {
        // Do render, respecting this.loadStatus and this.result
      },
      
      remove: function () {
        if (this.r) {
          this.r.dispose();
          this.r = null;
        }
        Backbone.View.prototype.remove.apply(this, arguments);
      },
    });
