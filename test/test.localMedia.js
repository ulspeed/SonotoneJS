module("Test for Chrome/Firefox", {

	setup: function() {
		
		this.caps = {
			browser: "chrome/Firefox",
			browserVersion: 31,
			canDoAudioVideoCall: true,
			canDoScreenSharing: true,
			canViewScreenSharing: true,
			canUseDataChannel: true,
			startedWithHTTPS: false
		};
	}
});

test("Test that there is no stream by default", function () {

	var localMedia = new Sonotone.IO.LocalMedia(this.caps);    

    equal(localMedia.streamVideo(), null, "No default video stream");
    equal(localMedia.streamScreen(), null, "No default screen stream");
    equal(localMedia.isCameraCaptured(), false, "No camera stream captured");
    equal(localMedia.isScreenCaptured(), false, "No screen stream captured");
    equal(localMedia.caps(), this.caps, "Caps passed are ok");
});


test("Test that aquire method calls the OK callback", function () {
    
	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, 'getUserMedia', function(c, callback, errcallback, context) {
		callback.call(this, {});
	});

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spy = sinon.spy();
    

    localMedia.on('onLocalVideoStreamStarted', spy, this);

    localMedia.acquire({video:true, audio: true, format:'cam'});

    ok(spy.called, "Callback is called");
});

test("Test that aquire method calls the OK callback and not the errorCallback", function () {

	
	var adapter = new Sonotone.IO.Adapter();	

	var stub = sinon.stub(adapter, 'getUserMedia', function(c, callback, errcallback, context) {
		callback.call(this, {});
	});

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spy = sinon.spy();
    var spyError = sinon.spy();

    localMedia.on('onLocalVideoStreamStarted', spy, this);
    localMedia.on('onLocalVideoStreamError', spyError, this);

    localMedia.acquire({video:true, audio: true, format:'cam'});

    ok(spy.called, "Callback is called");
    ok(!spyError.called, "Error Callback is not called");
});

test("Test that aquire method call the OK callback with the correct paramters", function () {

	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, 'getUserMedia', function(c, callback, errcallback, context) {
		callback.call(this, {});
	});

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spy = sinon.spy();

    localMedia.on('onLocalVideoStreamStarted', spy, this);

    localMedia.acquire({video:true, audio: true, format:'cam'});

    equal(spy.args.length, 1, "Callback is called with the stream");
    equal(typeof spy.args[0][0], 'object', "Callback is called with the stream");
    notEqual(localMedia.streamVideo(), null, "Stream Video has been instantiated");
    equal(localMedia.streamScreen(), null, "Stream Screen is still null");
    equal(localMedia.isCameraCaptured(), true, "Stream video has been captured");
    equal(localMedia.isScreenCaptured(), false, "Stream screen has not been captured");
});


test("Test that the error callback is called when there is a problem acquiring the camera", function() {

	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, 'getUserMedia', function(c, callback, errcallback, context) {
		errcallback.call(this, "error");
	});

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spyError = sinon.spy();

    localMedia.on('onLocalVideoStreamError', spyError, this);

    localMedia.acquire({video:true, audio: true, format:'cam'});

    ok(spyError.called, "Error Callback is called");

    equal(spyError.args.length, 1, "Callback is called with a parameter");
    equal(typeof spyError.args[0][0], 'object', "Callback is called with an object");
    equal(spyError.args[0][0].code, 1, "Parameter contains an error code");
    equal(spyError.args[0][0].message, "", "Parameter contains an empty message");
    equal(spyError.args[0][0].name, "PERMISSION_DENIED", "Parameter contains a name");
    equal(localMedia.streamVideo(), null, "Stream Video has been instantiated");
    equal(localMedia.streamScreen(), null, "Stream Screen is still null");
    equal(localMedia.isCameraCaptured(), false, "Stream video has been captured");
    equal(localMedia.isScreenCaptured(), false, "Stream screen has not been captured");
});

test("Test that the error callback is called when there is a problem acquiring the camera and not the other callback", function() {

	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, 'getUserMedia', function(c, callback, errcallback, context) {
		errcallback.call(this, "error");
	});

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spy = sinon.spy();
    var spyError = sinon.spy();

    localMedia.on('onLocalVideoStreamStarted', spy, this);
    localMedia.on('onLocalVideoStreamError', spyError, this);

    localMedia.acquire({video:true, audio: true, format:'cam'});

    ok(!spy.called, "Callback is not called");
    ok(spyError.called, "Error Callback is called");
});

test("Test that the error callback is called with the correct parameters", function() {

	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, 'getUserMedia', function(c, callback, errcallback, context) {
		errcallback.call(this, "error");
	});

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spyError = sinon.spy();

    localMedia.on('onLocalVideoStreamError', spyError, this);

    localMedia.acquire({video:true, audio: true, format:'cam'});

    equal(spyError.args.length, 1, "Callback is called with a parameter");
    equal(typeof spyError.args[0][0], 'object', "Callback is called with an object");
    equal(spyError.args[0][0].code, 1, "Parameter contains an error code");
    equal(spyError.args[0][0].message, "", "Parameter contains an empty message");
    equal(spyError.args[0][0].name, "PERMISSION_DENIED", "Parameter contains a name");
    equal(localMedia.streamVideo(), null, "Stream Video has been instantiated");
    equal(localMedia.streamScreen(), null, "Stream Screen is still null");
    equal(localMedia.isCameraCaptured(), false, "Stream video has been captured");
    equal(localMedia.isScreenCaptured(), false, "Stream screen has not been captured");
});

module("Test for Safari/IE", {

	setup: function() {
		
		this.caps = {
			browser: "Safari/IE",
			browserVersion: 6,
			canDoAudioVideoCall: false,
			canDoScreenSharing: false,
			canViewScreenSharing: false,
			canUseDataChannel: false,
			startedWithHTTPS: false
		};
	}
});

test("Test that aquire method calls the error callback when the browser is not compliant", function () {
    
	var adapter = new Sonotone.IO.Adapter();

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spyError = sinon.spy();

    localMedia.on('onLocalVideoStreamError', spyError, this);

    localMedia.acquire({video:true, audio: true, format:'cam'});

    ok(spyError.called, "Error Callback is called when browser is not compliant");
});

test("Test that aquire method calls the error callback and not the callback when the browser is not compliant", function () {
    
	var adapter = new Sonotone.IO.Adapter();

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spyError = sinon.spy();
    var spy = sinon.spy();

    localMedia.on('onLocalVideoStreamError', spyError, this);
    localMedia.on('onLocalVideoStreamStarted', spy, this);

    localMedia.acquire({video:true, audio: true, format:'cam'});

    ok(spyError.called, "Error Callback is called when browser is not compliant");
    ok(!spy.called, "Callback is not called when browser is not compliant");
});

test("Test that aquire method calls the error callback with the correct parameters", function () {
    
	var adapter = new Sonotone.IO.Adapter();

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spyError = sinon.spy();

    localMedia.on('onLocalVideoStreamError', spyError, this);

    localMedia.acquire({video:true, audio: true, format:'cam'});

    equal(spyError.args.length, 1, "Callback is called with a parameter");
    equal(typeof spyError.args[0][0], 'object', "Callback is called with an object");
    equal(spyError.args[0][0].code, 2, "Parameter contains an error code");
    equal(spyError.args[0][0].message, "", "Parameter contains an empty message");
    equal(spyError.args[0][0].name, "BROWSER_NOT_COMPLIANT", "Parameter contains a name");
    equal(localMedia.streamVideo(), null, "Stream Video has been instantiated");
    equal(localMedia.streamScreen(), null, "Stream Screen is still null");
    equal(localMedia.isCameraCaptured(), false, "Stream video has been captured");
    equal(localMedia.isScreenCaptured(), false, "Stream screen has not been captured");
});

