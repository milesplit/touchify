//     Touchify
//     (c) 2011 Jason Byrne, MileSplit
//     Some code derived from code by Thomas Fuchs (2010, 2011) for Zepto.js
//     May be freely distributed under the MIT license.


var touchify = function(touchTarget, o) {
	// Events thrown: grab, hold, longpress, release, flick, tap, doubletap
	var start = { x:null, y:null, t:null },
		delta = { x:0, y:0, t:0 },
		last = { x:null, y:null, t:null }, lastHold = 0, touchTimer=null, moveFrequency=60,
		touchEnabled = (typeof window.ontouchstart != 'undefined'),
		threshold = { move:5, longpress:750, swipeTime:2000, swipeDistance:20, doubleTapTime:250 },
		touchClass = 'touched', touchType = 'changedTouches', touchX = 'screenX', touchY = 'screenY',
		touchevent = touchEnabled ?
			{ start:'touchstart', move:'touchmove', end:'touchend', cancel:'touchcancel' } :
			{ start:'mousedown', move:'mousemove', end:'mouseup', cancel:'mouseout' },
		triggers = { tap:'tap', doubletap:'doubletap', swipe:'flick', release:'release', drag:'grab', hold:'hold', longpress:'longpress' },
		point = function(e) { return (touchEnabled) ? e[touchType][0] : e; },
		trigger = function(type, o) {
			o = o || {};
			o.delta = delta;
			o.start = start;
			touchTarget.trigger(type, o);
		},
		slideDirection = function(abs){
			if (abs.x >= abs.y) { return (delta.x > 0 ? 'left' : 'right'); }
			else { return (delta.y > 0 ? 'up' : 'down'); }
		},
		clearTouch = function(initial) {
			// Reset all data
			start = { x:null, y:null, t:null };
			delta = { x:0, y:0, t:0 };
			clearInterval(touchTimer);
			touchTimer = null;
			lastHold = 0;
			touchTarget.removeClass(touchClass)
				.unbind(touchevent.move, onTouchMove)
				.unbind(touchevent.end, onTouchEnd)
				.unbind(touchevent.cancel, onTouchCancel);
			if (!initial) {
				trigger(triggers.release);
			}
		},
		onTouchStart = function(e) {
			var p = point(e);
			clearTouch(true);
			start = { x:p[touchX], y:p[touchY], t:(new Date).getTime() };
			// Touch Timer: checks for longpress/hold and minimizes how often move events are thrown
			touchTimer = setInterval(function() {
				if (start.t != null) {
					delta.t = (new Date).getTime() - start.t;
					if (Math.abs(delta.x) < threshold.move && Math.abs(delta.y) < threshold.move) {
						if (delta.t >= threshold.longpress) {
							if (lastHold == 0) {
								trigger(triggers.longpress);
							}
							if (delta.t - lastHold >= threshold.longpress) {
								trigger(triggers.hold);
								lastHold = delta.t;
							}
						}
					} else {
						trigger(triggers.drag);
					}
				} else {
					clearTouch();
				}
			}, moveFrequency);
			// Bind touch events
			$el.addClass(touchClass)
				.bind(touchevent.move, onTouchMove)
				.bind(touchevent.end, onTouchEnd)
				.bind(touchevent.cancel, onTouchCancel);
			// Prevent dragging
			if (!touchEnabled) {
				e.preventDefault();
			}
		},
		onTouchMove = function(e) {
			if (start.t != null) {
				var p = point(e);
				delta.y = (p[touchY] - start.y);
				delta.x = (p[touchX] - start.x);
			}
		},
		onTouchEnd = function(e) {
			if (start.t != null) {
				var abs = { x:Math.abs(delta.x), y: Math.abs(delta.y) };
				delta.t = (new Date).getTime() - start.t;
				if (abs.y < threshold.move && abs.x < threshold.move) {
					if (start.t - last.t < threshold.doubleTapTime) {
						trigger(triggers.doubletap);
					} else {
						trigger(triggers.tap);
					}
				} else if ((abs.x >= threshold.swipeDistance || abs.y >= threshold.swipeDistance) && delta.t <= threshold.swipeTime) {
					trigger(triggers.swipe, { direction:slideDirection(abs)	});
				}
				last = { x:start.x, y:start.y, t:start.t };
			}
			clearTouch();
		},
		onTouchCancel = function() {
			clearTouch();
		};
	return (function() {
		$el.bind(touchevent.start, onTouchStart);
		return $el;
	})();
};

$.fn.touchify = function(o) {
	return this.each(function(){
		touchify($(this), o);
	});
};