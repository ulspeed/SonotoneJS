module("Tests the subscription to an event");

test("When subscribing to event, my callback function is called", function () {
    
	var events = new Sonotone.IO.Events();

	var callback = sinon.spy();
	events.on('myEvent', callback, this);

	events.trigger('myEvent', null);

    ok(callback.called, "Callback called");
});

test("When subscribing to event, my callback is not called on other events", function () {
    
	var events = new Sonotone.IO.Events();

	var callback = sinon.spy();
	events.on('myEvent', callback, this);

	events.trigger('myOtherEvent', null);

    ok(!callback.called, "Callback not called on other event");
});

test("When subscribing to event, each callback is called once", function () {
    
	var events = new Sonotone.IO.Events();

	var callback = sinon.spy();
	events.on('myEvent', callback, this);

	var callback2 = sinon.spy();
	events.on('myEvent', callback2, this);

	var callback3 = sinon.spy();
	events.on('myEvent', callback3, this);

	events.trigger('myEvent', null);

    ok(callback.called, "First callback is called once");
    ok(callback2.called, "Second callback is called once");
    ok(callback3.called, "Third callback is called once");
});

test("When subscribing to event, my callback is called each time the event is fired", function () {
    
	var events = new Sonotone.IO.Events();

	var callback = sinon.spy();
	events.on('myEvent', callback, this);

	events.trigger('myEvent', null);
	events.trigger('myOtherEvent', null);
	events.trigger('myEvent', null);
	events.trigger('myEvent', null);

    ok(callback.calledThrice, "Callback is called each time");
});

module("Tests the unsubscription from an event");

test("When unsubscribing to an event, my callback is no more called", function () {
    
	var events = new Sonotone.IO.Events();

	var callback = sinon.spy();
	events.on('myEvent', callback, this);
	events.off('myEvent', callback);

	events.trigger('myEvent', null);

    ok(!callback.called, "Callback is called each time");
});

test("When unsubscribing to an event with an other callback, my callback is still on", function () {
    
	var events = new Sonotone.IO.Events();

	var callback = sinon.spy();
	var callbackFake = sinon.spy();
	events.on('myEvent', callback, this);
	events.on('myEvent', callbackFake, this);
	events.off('myEvent', callbackFake);

	events.trigger('myEvent', null);

    ok(callback.calledOnce, "Callback is called");
});

test("When unsubscribing to unexisting event with the same callback, my callback is still on", function () {
    
	var events = new Sonotone.IO.Events();

	var callback = sinon.spy();
	events.off('myEventFake', callback);
	events.on('myEvent', callback, this);
	events.off('myEventFake', callback);

	events.trigger('myEvent', null);

    ok(callback.calledOnce, "Callback is called");
});





