//     touchMe
//     (c) 2011 Jason Byrne, MileSplit
//     Some code derived from code by Thomas Fuchs (2010, 2011) for Zepto.js
//     May be freely distributed under the MIT license.


var touchMe = function($el, o) {
	// Events thrown: grab, hold, longpress, release, flick, tap, doubletap
	var start = { x:null, y:null, t:null },
		delta = { x:0, y:0, t:0 },
		last = { x:null, y:null, t:null }, lastHold = 0,
		touchTarget = $el, touchTimer=null,
		touchEnabled = (typeof window.ontouchstart != 'undefined'),
		threshold = { move:5, tap:300, longpress:750, swipeTime:2000, swipeDistance:20, doubleTapTime:250 },
		touchClass = 'touched', touchType = 'changedTouches', touchX = 'screenX', touchY = 'screenY',
		touchevent = touchEnabled ?
			{ start:'touchstart', move:'touchmove', end:'touchend', cancel:'touchcancel' } :
			{ start:'mousedown', move:'mousemove', end:'mouseup', cancel:'mouseout' },
		triggers = { tap:'tap', doubletap:'doubletap', swipe:'flick', release:'release', drag:'grab', hold:'hold', longpress:'longpress'  },
		point = function(e) { return (touchEnabled) ? e[touchType][0] : e; },
		slideDirection = function(abs){
			if (abs.x >= abs.y) {
				return (delta.x > 0 ? 'left' : 'right');
			} else {
				return (delta.y > 0 ? 'up' : 'down');
			}
		},
		clearTouch = function(initial) {
			start = { x:null, y:null, t:null };
			delta = { x:0, y:0, t:0 };
			clearInterval(touchTimer);
			touchTimer = null;
			lastHold = 0;
			// Bind touch events
			touchTarget.removeClass(touchClass)
				.unbind(touchevent.move, onTouchMove)
				.unbind(touchevent.end, onTouchEnd)
				.unbind(touchevent.cancel, onTouchCancel);
			if (!initial) {
				touchTarget.trigger(triggers.release);
			}
		},
		onTouchStart = function(e) {
			var p = point(e);
			clearTouch(true);
			start = { x:p[touchX], y:p[touchY], t:(new Date).getTime() };
			// Touch Timer
			touchTimer = setInterval(function() {
				if (start.t != null) {
					delta.t = (new Date).getTime() - start.t;
					if (Math.abs(delta.x) < threshold.move && Math.abs(delta.y) < threshold.move) {
						if (delta.t >= threshold.longpress) {
							if (lastHold == 0) {
								touchTarget.trigger(triggers.longpress, e);
							}
							if (delta.t - lastHold >= threshold.longpress) {
								touchTarget.trigger(triggers.hold, e);
								lastHold = delta.t;
							}
						}
					} else {
						touchTarget.trigger(triggers.drag, {
							delta:delta
						});
					}
				} else {
					clearTouch();
				}
			}, 60);
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
						touchTarget.trigger(triggers.doubletap, e);
					} else {
						touchTarget.trigger(triggers.tap, e);
					}
				} else if ((abs.x >= threshold.swipeDistance || abs.y >= threshold.swipeDistance) && delta.t <= threshold.swipeTime) {
					touchTarget.trigger(triggers.swipe, {
						direction:slideDirection(abs)
					});
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

$.fn.touchMe = function(o) {
	return this.each(function(){
		touchMe($(this), o);
	});
};