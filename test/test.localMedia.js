module("Test the acquire video for Chrome/Firefox", {

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

module("Test the acquire video for Safari/IE", {

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

module("Test the acquire screen for Chrome", {

	setup: function() {
		
		this.caps = {
			browser: "Chrome",
			browserVersion: 6,
			canDoAudioVideoCall: true,
			canDoScreenSharing: true,
			canViewScreenSharing: true,
			canUseDataChannel: true,
			startedWithHTTPS: true
		};
	}
});

test("Test that aquire method calls the OK callback", function () {

	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, 'getUserMedia', function(c, callback, errcallback, context) {
		callback.call(this, {});
	});

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spy = sinon.spy();

    localMedia.on('onLocalScreenStreamStarted', spy, this);

    localMedia.acquireScreen();

    ok(spy.called, "Callback is called");
});

test("Test that aquire method call the OK callback with the correct paramters", function () {

	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, 'getUserMedia', function(c, callback, errcallback, context) {
		callback.call(this, {});
	});

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spy = sinon.spy();

    localMedia.on('onLocalScreenStreamStarted', spy, this);

    localMedia.acquireScreen();

    equal(spy.args.length, 1, "Callback is called with the stream");
    equal(typeof spy.args[0][0], 'object', "Callback is called with the stream");
    notEqual(localMedia.streamScreen(), null, "Stream Video has been instantiated");
    equal(localMedia.streamVideo(), null, "Stream Screen is still null");
    equal(localMedia.isCameraCaptured(), false, "Stream video has been captured");
    equal(localMedia.isScreenCaptured(), true, "Stream screen has not been captured");
});

test("Test that the error callback is called when there is a problem acquiring the camera", function() {

	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, 'getUserMedia', function(c, callback, errcallback, context) {
		errcallback.call(this, "error");
	});

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spyError = sinon.spy();

    localMedia.on('onLocalScreenStreamError', spyError, this);

    localMedia.acquireScreen();

    ok(spyError.called, "Error Callback is called");

    equal(spyError.args.length, 1, "Callback is called with a parameter");
    equal(typeof spyError.args[0][0], 'object', "Callback is called with an object");
    equal(spyError.args[0][0].code, 1, "Parameter contains an error code");
    equal(spyError.args[0][0].message, "", "Parameter contains an empty message");
    equal(spyError.args[0][0].name, "PERMISSION_DENIED", "Parameter contains a name");
    equal(localMedia.streamScreen(), null, "Stream Video has been instantiated");
    equal(localMedia.streamVideo(), null, "Stream Screen is still null");
    equal(localMedia.isCameraCaptured(), false, "Stream video has been captured");
    equal(localMedia.isScreenCaptured(), false, "Stream screen has not been captured");
});

module("Test the acquire screen for Chrome when not in HTTPS", {

	setup: function() {
		
		this.caps = {
			browser: "Chrome",
			browserVersion: 6,
			canDoAudioVideoCall: true,
			canDoScreenSharing: true,
			canViewScreenSharing: true,
			canUseDataChannel: true,
			startedWithHTTPS: false
		};
	}
});

test("Test that aquire screen method calls the error callback on chrome when the browser is not in https", function () {
    
	var adapter = new Sonotone.IO.Adapter();

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spyError = sinon.spy();

    localMedia.on('onLocalScreenStreamError', spyError, this);

    localMedia.acquireScreen();

    ok(spyError.called, "Error Callback is called when browser is not in HTTPS");
});

test("Test that aquire screen method calls the error callback with the correct parameters (when not in https)", function () {
    
	var adapter = new Sonotone.IO.Adapter();

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spyError = sinon.spy();

    localMedia.on('onLocalScreenStreamError', spyError, this);

    localMedia.acquireScreen();

    equal(spyError.args.length, 1, "Callback is called with a parameter");
    equal(typeof spyError.args[0][0], 'object', "Callback is called with an object");
    equal(spyError.args[0][0].code, 3, "Parameter contains an error code");
    equal(spyError.args[0][0].message, "", "Parameter contains an empty message");
    equal(spyError.args[0][0].name, "PROTOCOL_ERROR", "Parameter contains a name");
    equal(localMedia.streamVideo(), null, "Stream Video has been instantiated");
    equal(localMedia.streamScreen(), null, "Stream Screen is still null");
    equal(localMedia.isCameraCaptured(), false, "Stream video has been captured");
    equal(localMedia.isScreenCaptured(), false, "Stream screen has not been captured");
});

module("Test the acquire screen for a browser not compliant", {

	setup: function() {
		
		this.caps = {
			browser: "Browser not compliant",
			browserVersion: 6,
			canDoAudioVideoCall: true,
			canDoScreenSharing: false,
			canViewScreenSharing: false,
			canUseDataChannel: true,
			startedWithHTTPS: true
		};
	}
});

test("Test that aquire screen method calls the error callback on chrome when the browser is not in https", function () {
    
	var adapter = new Sonotone.IO.Adapter();

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spyError = sinon.spy();

    localMedia.on('onLocalScreenStreamError', spyError, this);

    localMedia.acquireScreen();

    ok(spyError.called, "Error Callback is called when browser is not in HTTPS");
});

test("Test that aquire screen method calls the error callback with the correct parameters (when not in https)", function () {
    
	var adapter = new Sonotone.IO.Adapter();

	var localMedia = new Sonotone.IO.LocalMedia(this.caps, adapter);

    var spyError = sinon.spy();

    localMedia.on('onLocalScreenStreamError', spyError, this);

    localMedia.acquireScreen();

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

module("Test constraints");

test("Test that the constraints function return the correct constraints for all supported type", function() {

	var localMedia = new Sonotone.IO.LocalMedia();

	var constraints = {
		audio: false,
		video: true,
		format: 'qvga'
	};

	var res = localMedia._getMediaConstraints(constraints);

	equal(res.audio, false, "Audio constrants should be false");
	equal(res.video.mandatory.maxWidth, 320, "qvga Width Video constraints should be ok");
	equal(res.video.mandatory.maxHeight, 240, "qvga Height Video constraints should be ok");

	constraints.format = 'qvga_16:9';

	res = localMedia._getMediaConstraints(constraints);

	equal(res.video.mandatory.maxHeight, 180, "qvga 16:9 Height Video constraints should be ok");

	constraints.format = 'vga';

	res = localMedia._getMediaConstraints(constraints);

	equal(res.video.mandatory.maxWidth, 640, "vga Width Video constraints should be ok");
	equal(res.video.mandatory.maxHeight, 480, "vga Height Video constraints should be ok");

	constraints.format = 'vga_16:9';

	res = localMedia._getMediaConstraints(constraints);

	equal(res.video.mandatory.maxWidth, 640, "vga Width Video constraints should be ok");
	equal(res.video.mandatory.maxHeight, 360, "vga 16:9 Height Video constraints should be ok");

	constraints.format = 'cam';

	res = localMedia._getMediaConstraints(constraints);

	equal(res.video.mandatory.maxWidth, 960, "cam Width Video constraints should be ok");
	equal(res.video.mandatory.maxHeight, 720, "cam 16:9 Height Video constraints should be ok");

	constraints.format = 'hd';

	res = localMedia._getMediaConstraints(constraints);

	equal(res.video.mandatory.maxWidth, 1280, "vga Width Video constraints should be ok");
	equal(res.video.mandatory.maxHeight, 720, "vga 16:9 Height Video constraints should be ok");

	constraints.format = 'a_bad_value';

	res = localMedia._getMediaConstraints(constraints);

	equal(res.video.mandatory.maxWidth, 320, "With a bad value Width Video constraints should be ok");
	equal(res.video.mandatory.maxHeight, 240, "With a bad value Height Video constraints should be ok");


	constraints.format = null;

	res = localMedia._getMediaConstraints(constraints);

	equal(res.video.mandatory.maxWidth, 320, "With a null Width Video constraints should be ok");
	equal(res.video.mandatory.maxHeight, 240, "With a null Height Video constraints should be ok");

	delete constraints.format;

	res = localMedia._getMediaConstraints(constraints);

	equal(res.video.mandatory.maxWidth, 320, "Without format, Width Video constraints should be ok");
	equal(res.video.mandatory.maxHeight, 240, "Without format, Height Video constraints should be ok");	
});

module("Render the stream");

test("Test that the renderVideoStream render the element if the video stream exists", function() {

	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, "attachToMedia", function(elt, stream) {
		return elt;
	});

	var localMedia = new Sonotone.IO.LocalMedia({}, adapter);

	localMedia.streamVideo({});

	var res = localMedia.renderVideoStream("<video>");

	ok(stub.called, "AttachMedia method is called");
	equal(res, "<video>", "renderVideoStream returns the element");
});

test("Test that the renderVideoStream doesn't render the stream if there is not stream", function() {

	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, "attachToMedia", function(elt, stream) {
		return elt;
	});

	var localMedia = new Sonotone.IO.LocalMedia({}, adapter);

	var res = localMedia.renderVideoStream("<video>");

	ok(!stub.called, "AttachMedia method is called");
	equal(res, null, "renderVideoStream returns the element");
});

test("Test that the renderScreenStream render the element if the screen stream exists", function() {

	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, "attachToMedia", function(elt, stream) {
		return elt;
	});

	var localMedia = new Sonotone.IO.LocalMedia({}, adapter);

	localMedia.streamScreen({});

	var res = localMedia.renderScreenStream("<video>");

	ok(stub.called, "AttachMedia method is called");
	equal(res, "<video>", "renderScreenStream returns the element");
});

test("Test that the renderScreenStream doesn't render the stream if there is not stream", function() {

	var adapter = new Sonotone.IO.Adapter();

	var stub = sinon.stub(adapter, "attachToMedia", function(elt, stream) {
		return elt;
	});

	var localMedia = new Sonotone.IO.LocalMedia({}, adapter);

	var res = localMedia.renderScreenStream("<video>");

	ok(!stub.called, "AttachMedia method is called");
	equal(res, null, "renderScreenStream returns the element");
});






