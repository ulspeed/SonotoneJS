var root = this;

 /**
 * Sonotone namespace.
 *
 * @namespace
 */

var Sonotone;

//Export module
if (typeof exports !== 'undefined') {
    Sonotone = exports;
} else {
    Sonotone = root.Sonotone = {};
}

/**
 * Version
 * 
 * @api public
 */

Sonotone.VERSION = '0.4.6';

/**
 * ID
 *
 * @api public
 */

Sonotone.ID = new Date().getTime();

/**
 * Debug
 * True to display debug logs
 *
 * @api public
 */

Sonotone.debug = false;

/**
 * Logger
 *
 * @api private
 */

Sonotone.log = function(cat, msg, arg) {

    if(Sonotone.debug) {

        var color = {
            "SONOTONE.IO": "orange",
            "LOCALMEDIA": "blue",
            "TRANSPORT": 'green',
            "PEERCONNECTION": 'Maroon',
            "REMOTEMEDIA": "MediumPurple",
            "TODO": "cyan",
            "DATACHANNEL": "Crimson",
            "CAPABILITIES": "black"
        };

        var time = new Date();

        if(arg !== undefined) {
            console.log("%c|'O~O'| " + time.toLocaleTimeString() + ":" + time.getMilliseconds() + " [" + cat + "] - " + msg + " | %O", "color:" + color[cat], arg);
        }
        else {
         console.log("%c|'O~O'| " + time.toLocaleTimeString() + ":" + time.getMilliseconds() + " [" + cat + "] - " + msg, "color:" + color[cat]);   
        }
    }
};

/**
* Merge media constraints
*
* @api private
*/

Sonotone.mergeConstraints = function(cons1, cons2) {
    var merged = cons1;
    for (var name in cons2.mandatory) {
      merged.mandatory[name] = cons2.mandatory[name];
    }
    merged.optional.concat(cons2.optional);
    return merged;
};
