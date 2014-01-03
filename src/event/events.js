/**
 * Manage Events subscriptions and firings
 */
var Events = Sonotone.IO.Events = function(){
    this.events = null;
};

/**
 * Events interface.
 *
 */

Events.prototype = {

    /**
     * Subscribe to an event
     * @param {String} name The event to subscribe
     * @param {Function} callbackFunction The function to call
     * @param {Object} context The context to use when calling the callback function
     *
     * @api public
     */

    on: function(name, callback, context) {
        if(!this._events) {
            this._events = {};
        }
        
        var events = this._events[name] || (this._events[name] = []);
        
        events.push({callback: callback, ctx: context || this});
        
        return this;
    },

    /**
     * Unsubscribe to an event
     * @param {String} name The event to subscribe
     * @param {Function} callbackFunction The function to call
     *
     * @api public
     */

    off: function(name, callback) {
        if(this._events) {
            var events = this._events[name];
            if(events) {

                var index = -1;

                for (var i = 0, l = events.length; i < l; i++) {
                    if(callback === events[i].callback) {
                        index = i;
                    }
                }

                if(index > -1) {
                    events.splice(index, 1);
                }
            }
        }
    },

    /**
     * Trigger an event
     * @param {String} name The event to subscribe
     * @param {args} Arguments to send to the callback function
     *
     * @api public
     */
     
    trigger: function(name, args) {
        if (!this._events) {
            return this;
        }
        var events = this._events[name];

        if (events) {
            for (var i=0;i<events.length;i++) {
                events[i].callback.call(events[i].ctx, args);
            }
        }
    }
};

