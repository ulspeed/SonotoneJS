/**
 * Data Channel
 * Manage the Data Channel part of the Peer Connection
 * @param {String} id The ID to use
 * @param {Object} peer The parent peer where to add the Data Channel
 * @param {Object} caps The user capabilities 
 * @param {Object} channel The existing channel received (for answering to a channel)
 *
 * @namespace
 */

var DataChannel = Sonotone.IO.DataChannel = function(id, peer, caps, channel) {
    Sonotone.log("DATACHANNEL", "Initialize Data Channel for PeerConnection <" + id + ">");

    this._remotePeerID = id;

    this._isReady = false;

    this._callbacks = new Sonotone.IO.Events();

    this._channel = channel;

    this._file =[];

    this._fileInfo = null;

    this._remainingBlob = null;

    var that = this;

    if(caps.canUseDataChannel) {

        if(!this._channel) {
            Sonotone.log("DATACHANNEL", "Create a new Data Channel for PeerConnection <" + id + ">");
            this._channel = peer.createDataChannel(id, null);        
        }
        else {
            Sonotone.log("DATACHANNEL", "Reuse existing channel received for PeerConnection <" + id + ">");
        }
        // When data-channel is opened with remote peer
        this._channel.onopen = function(){
            Sonotone.log("DATACHANNEL", "Data-Channel successfully opened for PeerConnection <" + id + ">");
            that._isReady = true;
        };

        // On data-channel error
        this._channel.onerror = function(e){
            Sonotone.log("DATACHANNEL", "Data-Channel error for PeerConnection <" + id + ">", e);
            that._isReady = false;
        };

        // When data-channel is closed with remote peer
        this._channel.onclose = function(e){
            Sonotone.log("DATACHANNEL", "Data-Channel closed for PeerConnection <" + id + ">", e);
            that._isReady = false;
        };

        // On new message received
        this._channel.onmessage = function(e){

            Sonotone.log("DATACHANNEL", "Message received by PeerConnection <" + id + ">", e.data);

            if(e.data instanceof ArrayBuffer) {
                //Sonotone.log("DATACHANNEL", "Type ArrayBuffer");
                var blob = new Blob([e.data], {type: that._fileInfo.type});
                that._file.push(blob);

                var ack =  {
                    type: "ACK"
                };
                //Sonotone.log("DATACHANNEL", "Send ACK");
                that._channel.send(JSON.stringify(ack));
            }
            else if (e.data instanceof Blob) {
                //Sonotone.log("DATACHANNEL", "Type Blob");
                that._file.push(e.data);
            }
            else {

                try {

                    if(e.data.indexOf('{') === 0) {
                        Sonotone.log("DATACHANNEL", "Type SIG");
                        var jsonMessage = JSON.parse(e.data);

                        switch (jsonMessage.type) {
                            case "FILE_START":
                                Sonotone.log("DATACHANNEL", "Start receiving file", jsonMessage.content);
                                that._file = [];
                                that._fileInfo = jsonMessage.content;
                                break;
                            case "FILE_END":
                                var fullFile = new Blob(that._file);
                                Sonotone.log("DATACHANNEL", "End receiving file");
                                var file = {
                                    info: that._fileInfo,
                                    content: fullFile
                                };

                                that._callbacks.trigger('onFileReceived', file); 
                                break;
                            case "ACK":
                                //Sonotone.log("DATACHANNEL", "Received ACK");
                                if(that._remainingBlob.size) {
                                    //Sonotone.log("DATACHANNEL", "Continue to send remaining file part");
                                    that._sendBlobFile(that._remainingBlob);
                                }
                                else {
                                    //Sonotone.log("DATACHANNEL", "No more part to send");
                                     var msg = {
                                        type: "FILE_END"
                                    };
                                    that._channel.send(JSON.stringify(msg));
                                }
                                break;
                        }
                    }
                }
                catch(err) {
                    console.error(err);
                }
            }

        };
    }
    else if(!Sonotone.isDataChannelCompliant) {
        Sonotone.log("DATACHANNEL", "Browser not compliant for Data-Sharing");
    }


};

/**
 * DataChannel interface.
 *
 */

DataChannel.prototype = {

    /**
     * Is the Data Channel readu (= opened with other peer)
     * 
     * @api public
     */

    isReady: function() {
        return this._isReady;
    },

    /**
     * Send data using this Channel
     * @param {Object} data The data to send
     *
     * @api public
     */

    sendData: function(data) {
        if(this._isReady) {
            Sonotone.log("DATACHANNEL", "Try to send a message to the peer <" + this._remotePeerID + ">", data);
            this._channel.send(data);
        }
        else {
            Sonotone.log("DATACHANNEL", "Data Channel not ready for sending a message!");
        }
    },

    /**
     * Send data using this Channel
     * @param {Object} data The data to send
     *
     * @api public
     */

    sendFile: function(file) {

        var reader = new FileReader();

        var that = this;

        var msg = {
            type: "FILE_START",
            content: {
                fileName: file.name,
                size: file.size,
                type: file.type
            }
        };

        Sonotone.log("DATACHANNEL", "Send a file to peer <" + this._remotePeerID + ">");

        this._channel.send(JSON.stringify(msg));

        reader.onload = function(file) {

            if(reader.readyState === FileReader.DONE) {
                that._sendBlobFile(new Blob([file.target.result]));
            }
        };

        reader.readAsArrayBuffer(file);
    },

    /**
     * Subscribe to DataChannel events
     * @param {String} eventName The event to subscribe
     * @param {Function} callbackFunction The function to call
     * @param {Object} context The context to use when calling the callback function
     *
     * @api public
     */

    on: function(eventName, callbackFunction, context) {
        this._callbacks.on(eventName, callbackFunction, context);
    },

    /**
     * Unsubscribe to IO events
     * @param {String} eventName The event to unsubscribe
     * @param {Function} callbackFunction The registered callback
     *
     * @api public
     */    

    off: function(eventName, callbackFunction) {
        this._callbacks.off(eventName, callbackFunction);
    },

    /**
     * Send a part of a file using the Data Channel
     * File is splitted into chunks (blob)
     * @param {Object} blob File or a part of a file (remaining part of the file)
     *
     * @api private
     */

    _sendBlobFile: function(blob) {

        var toSend = null,
            chunkLength = 64000,
            fr = new FileReader(),
            that = this;

        if (blob.size > chunkLength) {
            toSend = blob.slice(0, chunkLength);
        }
        else {
            toSend = blob;
        }

        fr.onload = function() {
            that._remainingBlob = blob.slice(toSend.size);
            that._channel.send(this.result);
        };
        
        fr.readAsArrayBuffer(toSend);
    }
};