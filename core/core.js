var samsung = false

//samsung guts
var widgetAPI
var tvKey
var pluginAPI

if ('Common' in window) {
	alert("[QML] samsung smart tv")

	console.log = function() {
		var args = Array.prototype.slice.call(arguments)
		alert("[QML] " + args.join(" "))
	}

	console.log("loading")
	widgetAPI = new Common.API.Widget() // Creates Common module
	console.log("widget ok")
	tvKey = new Common.API.TVKeyValue()
	console.log("tv ok")
	pluginAPI = new Common.API.Plugin()
	console.log("plugin ok, sending ready")
	widgetAPI.sendReadyEvent() // Sends 'ready' message to the Application Manager
	console.log("registering keys")
	pluginAPI.registFullWidgetKey()
	console.log("loaded")
}

var keyCodes = {
	// SmartTV keys. TODO: make it platform depending.
	108: 'Red',
	20: 'Green',
	21: 'Yellow',
	22: 'Blue',
	4: 'Left',
	5: 'Right',
	29461: 'Down',
	29460: 'Up',
	29443: 'Select',
	68: 'PageUp',
	65: 'PageDown',

	13: 'Select',
	27: 'Back',
	37: 'Left',
	33: 'PageUp',
	34: 'PageDown',
	38: 'Up',
	39: 'Right',
	40: 'Down',
	112: 'Red',
	113: 'Green',
	114: 'Yellow',
	115: 'Blue'
}

var colorTable = {
	'maroon':	'800000',
	'red':		'ff0000',
	'orange':	'ffA500',
	'yellow':	'ffff00',
	'olive':	'808000',
	'purple':	'800080',
	'fuchsia':	'ff00ff',
	'white':	'ffffff',
	'lime':		'00ff00',
	'green':	'008000',
	'navy':		'000080',
	'blue':		'0000ff',
	'aqua':		'00ffff',
	'teal':		'008080',
	'black':	'000000',
	'silver':	'c0c0c0',
	'gray':		'080808'
}

_globals.core.Object = function(parent) {
	this.parent = parent;
	this.children = []
	this._local = {}
	this._changedHandlers = {}
	this._signalHandlers = {}
	this._pressedHandlers = {}
	this._animations = {}
	this._updaters = {}
}

_globals.core.Object.prototype.addChild = function(child) {
	this.children.push(child);
}

_globals.core.Object.prototype._setId = function (name) {
	var p = this;
	while(p) {
		p._local[name] = this;
		p = p.parent;
	}
}

_globals.core.Object.prototype.onChanged = function (name, callback) {
	if (name in this._changedHandlers)
		this._changedHandlers[name].push(callback);
	else
		this._changedHandlers[name] = [callback];
}

_globals.core.Object.prototype.removeOnChanged = function (name, callback) {
	if (name in this._changedHandlers) {
		var handlers = this._changedHandlers[name];
		for(var i = 0; i < handlers.length; ) {
			if (handlers[i] === callback) {
				handlers.splice(i, 1)
			} else
				++i
		}
	}
}

_globals.core.Object.prototype._removeUpdater = function (name, callback) {
	if (name in this._updaters)
		this._updaters[name]();

	if (callback) {
		this._updaters[name] = callback;
	} else
		delete this._updaters[name]
}

_globals.core.Object.prototype.onPressed = function (name, callback) {
	var wrapper
	if (name != 'Key')
		wrapper = function() { callback(); return true }
	else
		wrapper = callback;

	if (name in this._pressedHandlers)
		this._pressedHandlers[name].push(wrapper);
	else
		this._pressedHandlers[name] = [wrapper];
}

_globals.core.Object.prototype._update = function(name, value) {
	if (name in this._changedHandlers) {
		var handlers = this._changedHandlers[name];
		handlers.forEach(function(callback) { try { callback(value)} catch(ex) { console.log("on " + name + " changed callback failed: ", ex, ex.stack) }})
	}
}

_globals.core.Object.prototype.on = function (name, callback) {
	if (name in this._signalHandlers)
		this._signalHandlers[name].push(callback);
	else
		this._signalHandlers[name] = [callback];
}

_globals.core.Object.prototype._emitSignal = function(name) {
	var args = Array.prototype.slice.call(arguments);
	args.shift();
	if (name in this._signalHandlers) {
		var handlers = this._signalHandlers[name];
		handlers.forEach(function(callback) { try { callback.apply(this, args) } catch(ex) { console.log("signal " + name + " handler failed:", ex, ex.stack) } });
	}
}

_globals.core.Object.prototype._get = function (name) {
	if (this.hasOwnProperty(name))
		return this[name];
	var object = this;
	while(object) {
		if (name in object._local)
			return object._local[name];
		object = object.parent;
	}
	console.log(name, this);
	throw ("invalid property requested: '" + name + "' in context of " + this);
}

_globals.core.Object.prototype.setAnimation = function (name, animation) {
	this._animations[name] = animation;
}

_globals.core.Object.prototype.getAnimation = function (name, animation) {
	var a = this._animations[name]
	return (a && a.enabled())? a: null;
}

exports._setup = function() {
	_globals.core.ListModel.prototype.addChild = function(child) {
		this.append(child)
	}

	_globals.core.Timer.prototype._restart = function() {
		if (this._timeout) {
			clearTimeout(this._timeout);
			this._timeout = undefined;
		}
		if (this._interval) {
			clearTimeout(this._interval);
			this._interval = undefined;
		}

		if (!this.running)
			return;

		//console.log("starting timer", this.interval, this.repeat);
		var self = this;
		if (this.repeat)
			this._interval = setInterval(function() { self.triggered(); }, this.interval);
		else
			this._timeout = setTimeout(function() { self.triggered(); }, this.interval);
	}

	var blend = function(dst, src, t) {
		return t * (dst - src) + src;
	}

	_globals.core.Animation.prototype.interpolate = blend;

	_globals.core.Color = function(value) {
		var triplet
		if (value.substring(0, 4) == "rgba") {
			var b = value.indexOf('('), e = value.lastIndexOf(')')
			value = value.substring(b + 1, e).split(',')
			this.r = parseInt(value[0])
			this.g = parseInt(value[1])
			this.b = parseInt(value[2])
			this.a = parseInt(value[3])
			return
		}
		else {
			var h = value.charAt(0);
			if (h != '#')
				triplet = colorTable[value];
			else
				triplet = value.substring(1)
		}

		if (!triplet)
			throw "invalid color specification: " + value

		var len = triplet.length;
		if (len == 3 || len == 4) {
			var r = parseInt(triplet.charAt(0), 16)
			var g = parseInt(triplet.charAt(1), 16)
			var b = parseInt(triplet.charAt(2), 16)
			var a = (len == 4)? parseInt(triplet.charAt(3), 16): 15
			this.r = (r << 4) | r;
			this.g = (g << 4) | g;
			this.b = (b << 4) | b;
			this.a = (a << 4) | a;
		} else if (len == 6 || len == 8) {
			this.r = parseInt(triplet.substring(0, 2), 16)
			this.g = parseInt(triplet.substring(2, 4), 16)
			this.b = parseInt(triplet.substring(4, 6), 16)
			this.a = (len == 8)? parseInt(triplet.substring(6, 8), 16): 255
		} else
			throw "invalid color specification: " + value
	}
	_globals.core.Color.prototype.constructor = _globals.core.Color;

	var Color = _globals.core.Color

	var normalizeColor = function(spec) {
		return (new Color(spec)).get()
	}

	_globals.core.Color.prototype.get = function() {
		return "rgba(" + this.r + "," + this.g + "," + this.b + "," + (this.a / 255) + ")";
	}

	_globals.core.ColorAnimation.prototype.interpolate = function(dst, src, t) {
		var dst_c = new Color(dst), src_c = new Color(src);
		var r = Math.floor(blend(dst_c.r, src_c.r, t))
		var g = Math.floor(blend(dst_c.g, src_c.g, t))
		var b = Math.floor(blend(dst_c.b, src_c.b, t))
		var a = Math.floor(blend(dst_c.a, src_c.a, t))
		return "rgba(" + r + "," + g + "," + b + "," + a + ")";
	}

	_globals.core.Timer.prototype._update = function(name, value) {
		switch(name) {
			case 'running': this._restart(); break;
			case 'interval': this._restart(); break;
			case 'repeat': this._restart(); break;
		}
		_globals.core.Object.prototype._update.apply(this, arguments);
	}

	_globals.core.Item.prototype.toScreen = function() {
		var item = this
		var x = 0, y = 0
		var w = this.width, h = this.height
		while(item) {
			x += item.x + item.viewX
			y += item.y + item.viewY
			item = item.parent
		}
		return [x, y, x + w, y + h, x + w / 2, y + h / 2];
	}

	_globals.core.Border.prototype._update = function(name, value) {
		switch(name) {
			case 'width': this.parent.element.css({'border-width': value, 'margin-left': -value, 'margin-top': -value}); break;
			case 'color': this.parent.element.css('border-color', normalizeColor(value)); break;
		}
		_globals.core.Object.prototype._update.apply(this, arguments);
	}
	
	_globals.core.Item.prototype.addChild = function(child) {
		_globals.core.Object.prototype.addChild.apply(this, arguments)
		this._tryFocus(child)
	}

	_globals.core.Item.prototype._update = function(name, value) {
		switch(name) {
			case 'width':
				this.element.css('width', value)
				this.boxChanged()
				break;

			case 'height':
				this.element.css('height', value);
				this.boxChanged()
				break;

			case 'x':
			case 'viewX':
				value = this.x + this.viewX
				this.element.css('left', value);
				this.boxChanged()
				break;

			case 'y':
			case 'viewY':
				value = this.y + this.viewY
				this.element.css('top', value);
				this.boxChanged()
				break;

			case 'opacity': if (this.element) /*FIXME*/this.element.css('opacity', value); break;
			case 'visible':	if (this.element) /*FIXME*/this.element.css('visibility', value? 'visible': 'hidden'); break;
			case 'z':		this.element.css('z-index', value); break;
			case 'radius':	this.element.css('border-radius', value); break;
			case 'clip':	this.element.css('overflow', value? 'hidden': 'visible'); break
		}
		_globals.core.Object.prototype._update.apply(this, arguments);
	}

	_globals.core.Item.prototype.forceActiveFocus = function() {
		var item = this;
		while(item.parent) {
			item.parent._focusChild(item);
			item = item.parent;
		}
	}

	_globals.core.Item.prototype._tryFocus = function(child) {
		if (child.focusedChild || child.focus) { //already has focus tree
			var item = child;
			while(item.parent && !item.parent.focusedChild) {
				item.parent._focusChild(item)
				item = item.parent
			}
			return true;
		}
		return false;
	}

	_globals.core.Item.prototype._propagateFocusToParents = function() {
		var item = this;
		while(item.parent && !item.parent.focusedChild) {
			item.parent._focusChild(item)
			item = item.parent
		}
	}

	_globals.core.Item.prototype._focusTree = function(active) {
		this.activeFocus = active;
		if (this.focusedChild)
			this.focusedChild._focusTree(active);
	}

	_globals.core.Item.prototype._focusChild = function (child) {
		if (child.parent !== this)
			throw "invalid object passed as child"
		if (this.focusedChild === child)
			return
		if (this.focusedChild)
			this.focusedChild._focusTree(false)
		this.focusedChild = child
		if (this.focusedChild)
			this.focusedChild._focusTree(true)
	}

	_globals.core.Item.prototype.focusChild = function(child) {
		this._focusChild(child)
		this._propagateFocusToParents()
	}

	_globals.core.Item.prototype._processKey = function (event) {
		if (this.focusedChild && this.focusedChild._processKey(event))
			return true;

		var key = keyCodes[event.which];
		if (key) {
			if (key in this._pressedHandlers) {
				var handlers = this._pressedHandlers[key];
				for(var i = handlers.length - 1; i >= 0; --i) {
					var callback = handlers[i]
					try {
						if (callback(key, event))
							return true;
					} catch(ex) {
						console.log("on " + key + " handler failed:", ex, ex.stack)
					}
				}
			}

			if ('Key' in this._pressedHandlers) {
				var handlers = this._pressedHandlers['Key'];
				for(var i = handlers.length - 1; i >= 0; --i) {
					var callback = handlers[i]
					try {
						if (callback(key, event))
							return true
					} catch(ex) {
						console.log("onKeyPressed handler failed:", ex, ex.stack)
					}
				}
			}
		}
		else {
			console.log("unhandled key", event.which);
		}
		return false;
	}

	_globals.core.MouseArea.prototype._updatePosition = function(event) {
		if (!this.recursiveVisible)
			return

		var box = this.toScreen()
		var x = event.pageX - box[0]
		var y = event.pageY - box[1]
		if (x >= 0 && y >= 0 && x < this.width && y < this.height)
		{
			this.mouseX = x
			this.mouseY = y
		}
	}

	_globals.core.MouseArea.prototype._onClick = function(event) {
		if (!this.recursiveVisible)
			return

		this._updatePosition(event)
		this.clicked()
	}

	_globals.core.MouseArea.prototype._onEnter = function(event) {
		if (!this.hoverEnabled || !this.recursiveVisible)
			return

		this._updatePosition(event)
		this.hovered = true
	}

	_globals.core.MouseArea.prototype._onExit = function(event) {
		if (!this.hoverEnabled || !this.recursiveVisible)
			return

		this._updatePosition(event)
		this.hovered = false
	}

	_globals.core.MouseArea.prototype._onMove = function(event) {
		if (!this.hoverEnabled || !this.recursiveVisible)
			return

		this._updatePosition(event)
	}

	_globals.core.AnchorLine.prototype.toScreen = function() {
		return this.parent.toScreen()[this.boxIndex]
	}

	_globals.core.Anchors.prototype._update = function(name) {
		var self = this.parent;
		var parent = self.parent;
		var anchors = this;

		var update_left = function() {
			var parent_box = parent.toScreen();
			var left = anchors.left.toScreen();
			var lm = anchors.leftMargin || anchors.margins;
			var rm = anchors.rightMargin || anchors.margins;
			self.x = left + lm - parent_box[0] - self.viewX;
			if (anchors.right) {
				var right = anchors.right.toScreen();
				var rm = anchors.rightMargin || anchors.margins;
				self.width = right - left - rm - lm;
			}
		};

		var update_right = function() {
			var parent_box = parent.toScreen();
			var right = anchors.right.toScreen();
			var lm = anchors.leftMargin || anchors.margins;
			var rm = anchors.rightMargin || anchors.margins;
			if (anchors.left) {
				var left = anchors.left.toScreen();
				self.width = right - left - rm - lm;
			}
			self.x = right - parent_box[0] - rm - self.width - self.viewX;
		};

		var update_top = function() {
			var parent_box = parent.toScreen();
			var top = anchors.top.toScreen()
			var tm = anchors.topMargin || anchors.margins;
			var bm = anchors.bottomMargin || anchors.margins;
			self.y = top + tm - parent_box[1] - self.viewY;
			if (anchors.bottom) {
				var bottom = anchors.bottom.toScreen();
				self.height = bottom - top - bm - tm;
			}
		}

		var update_bottom = function() {
			var parent_box = parent.toScreen();
			var bottom = anchors.bottom.toScreen();
			var tm = anchors.topMargin || anchors.margins;
			var bm = anchors.bottomMargin || anchors.margins;
			if (anchors.top) {
				var top = anchors.top.toScreen()
				self.height = bottom - top - bm - tm;
			}
			self.y = bottom - parent_box[1] - bm - self.height - self.viewY;
		}

		var update_h_center = function() {
			var parent_box = parent.toScreen();
			var hcenter = anchors.horizontalCenter.toScreen();
			var lm = anchors.leftMargin || anchors.margins;
			var rm = anchors.rightMargin || anchors.margins;
			self.x = hcenter - self.width / 2 - parent_box[0] + lm - rm - self.viewX;
		}

		var update_v_center = function() {
			var parent_box = parent.toScreen();
			var vcenter = anchors.verticalCenter.toScreen();
			var tm = anchors.topMargin || anchors.margins;
			var bm = anchors.bottomMargin || anchors.margins;
			self.y = vcenter - self.height / 2 - parent_box[1] + tm - bm - self.viewY;
		}

		switch(name) {
			case 'left':
				update_left();
				anchors.left.parent.on('boxChanged', update_left);
				anchors.onChanged('leftMargin', update_left);
				break;

			case 'right':
				update_right()
				self.onChanged('width', update_right)
				anchors.right.parent.on('boxChanged', update_right)
				anchors.onChanged('rightMargin', update_right)
				break;

			case 'top':
				update_top()
				anchors.top.parent.on('boxChanged', update_top)
				anchors.onChanged('topMargin', update_top)
				break;

			case 'bottom':
				update_bottom();
				self.onChanged('height', update_bottom)
				anchors.bottom.parent.on('boxChanged', update_bottom);
				anchors.onChanged('bottomMargin', update_bottom);
				break;

			case 'horizontalCenter':
				update_h_center();
				self.onChanged('width', update_h_center);
				anchors.onChanged('leftMargin', update_h_center);
				anchors.onChanged('rightMargin', update_h_center);
				anchors.horizontalCenter.parent.on('boxChanged', update_h_center);
				break;

			case 'verticalCenter':
				update_v_center()
				self.onChanged('height', update_v_center)
				anchors.onChanged('topMargin', update_v_center)
				anchors.onChanged('bottomMargin', update_v_center)
				anchors.verticalCenter.parent.on('boxChanged', update_v_center)
				break;

			case 'fill':
				anchors.left = anchors.fill.left;
				anchors.right = anchors.fill.right;
				anchors.top = anchors.fill.top;
				anchors.bottom = anchors.fill.bottom;
				break;

			case 'centerIn':
				anchors.horizontalCenter = anchors.centerIn.horizontalCenter;
				anchors.verticalCenter = anchors.centerIn.verticalCenter;
				break;
		}
		_globals.core.Object.prototype._update.apply(this, arguments);
	}

	_globals.core.Font.prototype._update = function(name, value) {
		switch(name) {
			case 'family':		this.parent.element.css('font-family', value); this.parent._updateSize(); break
			case 'pointSize':	this.parent.element.css('font-size', value + "pt"); this.parent._updateSize(); break
			case 'pixelSize':	this.parent.element.css('font-size', value + "px"); this.parent._updateSize(); break
			case 'italic': 		this.parent.element.css('font-style', value? 'italic': 'normal'); this.parent._updateSize(); break
		}
		_globals.core.Object.prototype._update.apply(this, arguments);
	}

	_globals.core.Text.prototype.AlignLeft		= 0
	_globals.core.Text.prototype.AlignRight		= 1
	_globals.core.Text.prototype.AlignHCenter	= 2
	_globals.core.Text.prototype.AlignJustify	= 3

	_globals.core.Text.prototype.AlignTop		= 0
	_globals.core.Text.prototype.AlignBottom	= 1
	_globals.core.Text.prototype.AlignVCenter	= 2

	_globals.core.Text.prototype._updateSize = function() {
		if (parent.text == "14")
		var oldW = this.element.css('width')
		var oldH = this.element.css('height')
		this.element.css('width', '')
		this.element.css('height', '')
		var w = this.element.width();
		var h = this.element.height();
		this.element.css('width', oldW)
		this.element.css('height', oldH)
		this.paintedWidth = w;
		this.paintedHeight = h;
	}

	_globals.core.Text.prototype._update = function(name, value) {
		switch(name) {
			case 'text': this.element.text(value); this._updateSize(); break;
			case 'color': this.element.css('color', normalizeColor(value)); break;
			case 'wrap': this.element.css('white-space', value? 'normal': 'nowrap'); break;
			case 'horizontalAlignment':
				switch(value) {
				case this.AlignLeft:	this.element.css('text-align', 'left'); break
				case this.AlignRight:	this.element.css('text-align', 'right'); break
				case this.AlignHCenter:	this.element.css('text-align', 'center'); break
				case this.AlignJustify:	this.element.css('text-align', 'justify'); break
				}
				break
		}
		_globals.core.Item.prototype._update.apply(this, arguments);
	}

	_globals.core.Gradient.prototype.addChild = function(child) {
		this.stops.push(child)
		this.stops.sort(function(a, b) { return a.position > b.position; })
	}

	_globals.core.GradientStop.prototype._update = function() {
		this.parent.parent._update('gradient', this.parent)
	}

	_globals.core.GradientStop.prototype._getDeclaration = function() {
		return normalizeColor(this.color) + " " + Math.floor(100 * this.position) + "%"
	}

	_globals.core.Gradient.prototype.Vertical = 0
	_globals.core.Gradient.prototype.Horizontal = 1

	_globals.core.Gradient.prototype._getDeclaration = function() {
		var decl = []
		var orientation = this.orientation == this.Vertical? 'top': 'left'
		decl.push(orientation)

		var stops = this.stops
		var n = stops.length
		if (n < 2)
			return

		for(var i = 0; i < n; ++i) {
			var stop = stops[i]
			decl.push(stop._getDeclaration())
		}
		return decl.join()
	}

	_globals.core.Rectangle.prototype._update = function(name, value) {
		switch(name) {
			case 'color': this.element.css('background-color', normalizeColor(value)); break;
			case 'gradient': {
				if (value) {
					var decl = value._getDeclaration()
					this.element.css('background-color', '')
					//this.element.css('background', 'linear-gradient(to ' + decl + ')')
					this.element.css('background', '-o-linear-gradient(' + decl + ')')
					this.element.css('background', '-moz-linear-gradient(' + decl + ')')
					this.element.css('background', '-webkit-linear-gradient(' + decl + ')')
					this.element.css('background', '-ms-linear-gradient(' + decl + ')')
				} else {
					this.element.css('background', '')
					this._update('color', normalizeColor(this.color)) //restore color
				}
				break;
			}
		}
		_globals.core.Item.prototype._update.apply(this, arguments);
	}

	_globals.core.Image.prototype.Null = 0;
	_globals.core.Image.prototype.Ready = 1;
	_globals.core.Image.prototype.Loading = 2;
	_globals.core.Image.prototype.Error = 3;

	_globals.core.Image.prototype._onLoad = function() {
		this.paintedWidth = this.element.get(0).naturalWidth;
		this.paintedHeight = this.element.get(0).naturalHeight;
		this.status = this.Ready;
	}

	_globals.core.Image.prototype._onError = function() {
		this.status = this.Error;
	}

	_globals.core.Image.prototype._update = function(name, value) {
		switch(name) {
			case 'source': this.status = value? this.Loading: this.Null; this.element.attr('src', value); break;
		}
		_globals.core.Item.prototype._update.apply(this, arguments);
	}

	_globals.core.Row.prototype._layout = function() {
		var children = this.children;
		var p = 0
		var h = 0
		for(var i = 0; i < children.length; ++i) {
			var c = children[i]
			if (!c.hasOwnProperty('height'))
				continue
			var b = c.y + c.height
			if (b > h)
				h = b
			c.viewX = p
			p += c.width + this.spacing
		}
		if (p > 0)
			p -= this.spacing
		this.contentWidth = p
		this.contentHeight = h
	}

	_globals.core.Row.prototype.addChild = function(child) {
		_globals.core.Item.prototype.addChild.apply(this, arguments)
		child.onChanged('width', this._layout.bind(this))
	}

	_globals.core.Column.prototype._layout = function() {
		var children = this.children;
		var p = 0
		var w = 0
		for(var i = 0; i < children.length; ++i) {
			var c = children[i]
			if (!c.hasOwnProperty('height'))
				continue
			var r = c.x + c.width
			if (r > w)
				w = r
			c.viewY = p
			p += c.height + this.spacing
		}
		if (p > 0)
			p -= this.spacing
		this.contentWidth = w
		this.contentHeight = p
	}

	_globals.core.Column.prototype.addChild = function(child) {
		_globals.core.Item.prototype.addChild.apply(this, arguments)
		child.onChanged('height', this._layout.bind(this))
	}

	_globals.core.ListView.prototype.Vertical	= 0
	_globals.core.ListView.prototype.Horizontal	= 1

	_globals.core.ListView.prototype._onReset = function() {
		var model = this.model
		var items = this._items
		console.log("reset", model.count)
		if (items.count > model.count) {
			this._onRowsRemoved(model.count, items.length)
		} else {
			this._onRowsChanged(0, items.length)
			this._onRowsInserted(items.length, model.count)
		}
		this._layout()
	}

	_globals.core.ListView.prototype._onRowsInserted = function(begin, end) {
		console.log("rows inserted", begin, end)
		var items = this._items
		for(var i = begin; i < end; ++i)
			items.splice(i, 0, null)
		this._layout()
	}

	_globals.core.ListView.prototype._onRowsChanged = function(begin, end) {
		console.log("rows changed", begin, end)
		var items = this._items
		for(var i = begin; i < end; ++i) {
			var item = items[i];
			if (item && item.element)
				item.element.remove()
			items[i] = null
		}
		this._layout()
	}

	_globals.core.ListView.prototype._onRowsRemoved = function(begin, end) {
		console.log("rows removed", begin, end)
		var items = this._items
		for(var i = begin; i < end; ++i) {
			var item = items[i];
			if (item && item.element)
				item.element.remove()
			items[i] = null
		}
		items.splice(begin, end - begin)
		this._layout()
	}

	_globals.core.ListView.prototype._layout = function() {
		var model = this.model;
		if (!model)
			return

		this.count = model.count
		var w = this.width, h = this.height
		if (!w || !h)
			return

		var items = this._items
		var n = items.length
		//console.log("layout " + n + " into " + w + "x" + h)
		var horizontal = this.orientation === this.Horizontal
		var p = horizontal? -this.contentX: -this.contentY
		var size = horizontal? w: h
		var maxW = 0, maxH = 0

		var itemsCount = 0
		for(var i = 0; i < n; ++i) {
			var item = this._items[i]

			if (!item) {
				if (p >= size && itemsCount > 0)
					break

				var row = this.model.get(i)
				this._local['model'] = row
				this._items[i] = item = this.delegate()
				item._local['model'] = row
				delete this._local['model']
			}

			++itemsCount

			var s = (horizontal? item.width: item.height)
			var visible = (p + s >= 0 && p < size)

			if (item.x + item.width > maxW)
				maxW = item.width + item.x
			if (item.y + item.height > maxH)
				maxH = item.height + item.y

			if (horizontal)
				item.viewX = p
			else
				item.viewY = p

			if (this.currentIndex == i) {
				this.focusChild(item)
				this.positionViewAtIndex(i)
			}

			item.visible = visible
			p += s + this.spacing
			if (p >= size)
				break
		}
		if (p > 0)
			p -= this.spacing;

		p += horizontal? this.contentX: this.contentY
		if (itemsCount)
			p *= items.length / itemsCount

		if (horizontal) {
			this.contentWidth = p
			this.contentHeight = maxH
		} else {
			this.contentWidth = maxW
			this.contentHeight = p
		}
	}

	_globals.core.ListView.prototype._attach = function() {
		if (this._attached || !this.model || !this.delegate)
			return

		this.model.on('reset', this._onReset.bind(this))
		this.model.on('rowsInserted', this._onRowsInserted.bind(this))
		this.model.on('rowsChanged', this._onRowsChanged.bind(this))
		this.model.on('rowsRemoved', this._onRowsRemoved.bind(this))
		this._attached = true
		this._onReset()
	}

	_globals.core.ListView.prototype._update = function(name, value) {
		switch(name) {
		case 'width':
		case 'height':
			_globals.core.Item.prototype._update.apply(this, arguments);
		case 'contentX':
		case 'contentY':
			this._layout()
			return;
		case 'model':
			this._attach()
			break
		case 'delegate':
			if (value) {
				value.visible = false;
			}
			this._attach()
			break
		}
		_globals.core.Item.prototype._update.apply(this, arguments);
	}

	exports.Context.prototype = Object.create(qml.core.Item.prototype);
	exports.Context.prototype.constructor = exports.Context;

	exports.Context.prototype._onCompleted = function(callback) {
		this._completedHandlers.push(callback);
	}

	exports.Context.prototype._completed = function() {
		this._completedHandlers.forEach(function(callback) { try { callback(); } catch(ex) { console.log("completed handler failed", ex, ex.stack); }} )
		this._completedHandlers = [];
	}

	exports.Context.prototype.start = function(name) {
		var proto;
		if (typeof name == 'string') {
			//console.log('creating component...', name);
			var path = name.split('.');
			proto = _globals;
			for (var i = 0; i < path.length; ++i)
				proto = proto[path[i]]
		}
		else
			proto = name;
		var instance = Object.create(proto.prototype);
		proto.apply(instance, [this]);
		this._completed()
		this.boxChanged()
		return instance;
	}
}

exports.Context = function() {
	_globals.core.Item.apply(this, null);

	this._local['renderer'] = this;
	this._completedHandlers = []

	var win = $(window);
	var w = win.width();
	var h = win.height();
	//console.log("window size: " + w + "x" + h);

	var body = $('body');
	var div = $("<div id='renderer'></div>");
	body.append(div);
	$('head').append($("<style>" +
		"body { overflow: hidden; }" +
		"div#renderer { position: absolute; left: 0px; top: 0px; } " +
		"div { position: absolute; border-style: solid; border-width: 0px; white-space: nowrap; } " +
		"input { position: absolute; } " +
		"img { position: absolute; } " +
		"</style>"
	));

	this.element = div
	this.width = w;
	this.height = h;

	win.on('resize', function() { this.width = win.width(); this.height = win.height(); }.bind(this));
	var self = this;
	$(document).keydown(function(event) { if (self._processKey(event)) event.preventDefault(); } );

	//console.log("context created");
}

exports.addProperty = function(self, type, name) {
	var value;
	var timer;
	var timeout;
	var interpolated_value;
	switch(type) {
		case 'int':			value = 0; break;
		case 'bool':		value = false; break;
		case 'real':		value = 0.0; break;
		case 'string':		value = ""; break
		default: if (type[0].toUpperCase() == type[0]) value = null; break;
	}
	var convert = function(value) {
		switch(type) {
		case 'int':		return Math.floor(value);
		case 'bool':	return value? true: false;
		default:		return value;
		}
	}
	Object.defineProperty(self, name, {
		get: function() {
			return interpolated_value !== undefined? interpolated_value: value;
		},
		set: function(newValue) {
			if (!self.getAnimation) {
				console.log("bound unknown object", self)
				throw "invalid object";
			}
			newValue = convert(newValue)
			var animation = self.getAnimation(name)
			if (animation && value != newValue) {
				if (timer)
					clearInterval(timer);
				if (timeout)
					clearTimeout(timeout);

				var duration = animation.duration;
				var date = new Date();
				var started = date.getTime() + date.getMilliseconds() / 1000.0;

				var src = interpolated_value !== undefined? interpolated_value: value;
				var dst = newValue;
				timer = setInterval(function() {
					var date = new Date();
					var now = date.getTime() + date.getMilliseconds() / 1000.0;
					var t = 1.0 * (now - started) / duration;
					if (t >= 1)
						t = 1;

					interpolated_value = convert(animation.interpolate(dst, src, t));
					self._update(name, interpolated_value, src);
				});

				timeout = setTimeout(function() {
					clearInterval(timer);
					interpolated_value = undefined;
					self._update(name, dst, src);
				}, duration);
			}
			var oldValue = value;
			if (oldValue !== newValue) {
				value = newValue;
				if (!animation)
					self._update(name, newValue, oldValue);
			}
		},
		enumerable: true
	});
}

exports.addAliasProperty = function(self, name, getObject, getter, setter) {
	var target = getObject();
	target.onChanged(name, function(value) { self._update(name, value); });
	Object.defineProperty(self, name, {
		get: getter,
		set: setter,
		enumerable: true
	});
}

exports.addSignal = function(self, name) {
	self[name] = (function() {
		var args = Array.prototype.slice.call(arguments);
		args.splice(0, 0, name);
		self._emitSignal.apply(self, args);
	})
}

exports._bootstrap = function(self, name) {
	switch(name) {
		case 'core.ListModel':
			self._rows = []
			break;
		case 'core.ListView':
			self._items = []
			break;
		case 'core.Gradient':
			self.stops = []
			break
		case 'core.Animation':
			self._disabled = 0
			break
		case 'core.Item':
			if (!self.parent) //top-level item, do not create item
				break;
			if (self.element)
				throw "double ctor call";
			self.element = $('<div/>');
			self.parent.element.append(self.element);
			self.parent.onChanged('recursiveVisible', function(value) {
				self.recursiveVisible = value && self.visible
			})

			break;
		case 'core.MouseArea':
			self.element.click(self._onClick.bind(self))
			self.element.mousemove(self._onMove.bind(self))
			self.element.hover(self._onEnter.bind(self), self._onExit.bind(self)) //fixme: unsubscribe
			break;
		case 'core.Image':
			self.element.remove();
			self.element = $('<img/>');
			self.parent.element.append(self.element);
			self.element.on('load', self._onLoad.bind(self));
			self.element.on('error', self._onError.bind(self));
			break;
	}
}
