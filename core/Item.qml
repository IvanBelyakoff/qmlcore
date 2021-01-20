/// base component for every visible objects.
Object {
	property int x;							///< x coordinate
	property int y;							///< y coordinate
	property int z;							///< z coordinate
	property int width;						///< width of visible area
	property int height;					///< height of visible area
	property bool clip;						///< clip all children outside rectangular area defined by x, y, width, height
	property real radius;					///< round corner radius

	property bool focus;					///< this item can be focused
	property bool focused: focusedChild === this; ///< this item is focused among its siblings
	property bool activeFocus;				///< this item can receive events and really focused at this moment
	property Item focusedChild;				///< current focused item (this item only)

	property bool visible: true;			///< this item and its children are visible
	property bool visibleInView: true;		///< this item is visible inside view content area
	property bool recursiveVisible: true;	///< this item is actually visible on screen (all parents are visible as well)
	property real opacity: 1;				///< opacity of the item

	property Anchors anchors: Anchors { }
	property Effects effects: Effects { }
	property Transform transform: Transform { }

	property AnchorLine left: AnchorLine	{ boxIndex: 0; }
	property AnchorLine top: AnchorLine		{ boxIndex: 1; }
	property AnchorLine right: AnchorLine	{ boxIndex: 2; }
	property AnchorLine bottom: AnchorLine	{ boxIndex: 3; }

	property AnchorLine horizontalCenter:	AnchorLine	{ boxIndex: 4; }
	property AnchorLine verticalCenter:		AnchorLine	{ boxIndex: 5; }

	//do not use, view internal
	signal boxChanged;						///< emitted when position or size changed
	property int viewX;						///< x position in view (if any)
	property int viewY;						///< y position in view (if any)

	///@private
	constructor: {
		this._topPadding = 0
		if (parent) {
			if (this.element)
				throw new Error('double ctor call')

			this.createElement(this.getTag())
		} //no parent == top level element, skip
	}

	///@private
	onRecursiveVisibleChanged: {
		this.children.forEach(function(child) {
			child.recursiveVisible = value && child.visible && child.visibleInView
		})
	}

	///@private
	onVisibleChanged: {
		this.recursiveVisible = value && this.visibleInView && this.parent.recursiveVisible
		if (!value)
			this.parent._tryFocus()
	}

	///@private
	onVisibleInViewChanged: {
		this.recursiveVisible = value && this.visible && this.parent.recursiveVisible
	}

	///@private
	function discard() {
		_globals.core.Object.prototype.discard.apply(this)
		this.focusedChild = null
		if (this.element)
			this.element.discard()
	}

	/// returns tag for corresponding element
	function getTag() { return 'div' }

	///@private
	function registerStyle(style, tag) {
		style.addRule(tag, 'position: absolute; visibility: inherit; border-style: solid; border-width: 0px; white-space: nowrap; border-radius: 0px; opacity: 1.0; transform: none; left: 0px; top: 0px; width: 0px; height: 0px;')
	}

	/// default implementation of element creation routine.
	function createElement(tag) {
		this.element = this._context.createElement(tag)
		this._context.registerStyle(this, tag)
		this.parent.element.append(this.element)
	}

	/// map relative component coordinates to absolute screen ones
	function toScreen() {
		var item = this
		var x = 0, y = 0
		var w = this.width, h = this.height
		while(item) {
			x += item.x
			y += item.y
			if ('view' in item) {
				x += item.viewX + item.view.content.x
				y += item.viewY + item.view.content.y
			}
			item = item.parent
		}
		return [x, y, x + w, y + h, x + w / 2, y + h / 2];
	}

	///@private tries to set animation on name using css transitions, returns true on success
	function _updateAnimation(name, animation) {
		if (!this._context.backend.capabilities.csstransitions || (animation && !animation.cssTransition))
			return false

		var css = this._mapCSSAttribute(name)

		if (css !== undefined) {
			if (!animation)
				throw new Error('resetting transition was not implemented')

			animation._target = name
			return this.setTransition(css, animation)
		} else {
			return false
		}
	}

	///@private sets animation on given property
	function setAnimation(name, animation) {
		if (!this._updateAnimation(name, animation))
			_globals.core.Object.prototype.setAnimation.apply(this, arguments);
	}

	///@private passes style (or styles { a:, b:, c: ... }) to underlying element
	function style(name, style) {
		var element = this.element
		if (element)
			return element.style(name, style)
		else
			log('WARNING: style skipped:', name, style)
	}

	///@private adds child, focus it if child accepts focus
	function addChild (child) {
		_globals.core.Object.prototype.addChild.apply(this, arguments)
		if (child._tryFocus())
			child._propagateFocusToParents()
	}

	///@private returns css rule by property name
	function _mapCSSAttribute (name) {
		return { width: 'width', height: 'height', x: 'left', y: 'top', viewX: 'left', viewY: 'top', opacity: 'opacity', radius: 'border-radius', rotate: 'transform', boxshadow: 'box-shadow', transform: 'transform', visible: 'visibility', visibleInView: 'visibility', background: 'background', color: 'color', font: 'font' }[name]
	}

	/// @private
	function _update (name, value) {
		switch(name) {
			case 'width':
				this.style('width', value)
				this.boxChanged()
				break;

			case 'height':
				this.style('height', value - this._topPadding);
				this.boxChanged()
				break;

			case 'x':
			case 'viewX':
				var x = this.x + this.viewX
				this.style('left', x);
				this.boxChanged()
				break;

			case 'y':
			case 'viewY':
				var y = this.y + this.viewY
				this.style('top', y);
				this.boxChanged()
				break;

			case 'opacity': if (this.element) this.style('opacity', value); break;
			case 'visibleInView':
			case 'visible':
				if (this.element)
					this.style('visibility', (this.visible && this.visibleInView)? 'inherit': 'hidden')
					break
			case 'z':		this.style('z-index', value); break;
			case 'radius':	this.style('border-radius', value); break;
			case 'clip':	this.style('overflow', value? 'hidden': 'visible'); break;
		}
		_globals.core.Object.prototype._update.apply(this, arguments);
	}

	///@private sets current global focus to component
	function forceActiveFocus() {
		var item = this;
		while(item.parent) {
			item.parent._focusChild(item);
			item = item.parent;
		}
	}

	///@private tries to focus children or item itself
	function _tryFocus () {
		if (!this.visible)
			return false

		if (this.focusedChild && this.focusedChild._tryFocus())
			return true

		var children = this.children
		for(var i = 0; i < children.length; ++i) {
			var child = children[i]
			if (child._tryFocus()) {
				this._focusChild(child)
				return true
			}
		}
		return this.focus
	}

	///@private propagates focus to parent, if not set there
	function _propagateFocusToParents () {
		var item = this;
		while(item.parent && (!item.parent.focusedChild || !item.parent.focusedChild.visible)) {
			item.parent._focusChild(item)
			item = item.parent
		}
	}

	///@private returns status of global focus
	function hasActiveFocus () {
		var item = this
		while(item.parent) {
			if (item.parent.focusedChild != item)
				return false

			item = item.parent
		}
		return true
	}

	/// @private focus subtree of current focused child
	function _focusTree (active) {
		this.activeFocus = active;
		if (this.focusedChild)
			this.focusedChild._focusTree(active);
	}

	///@private
	function _focusChild  (child) {
		if (child.parent !== this)
			throw new Error('invalid object passed as child')
		if (this.focusedChild === child)
			return
		if (this.focusedChild)
			this.focusedChild._focusTree(false)
		this.focusedChild = child
		if (this.focusedChild)
			this.focusedChild._focusTree(this.hasActiveFocus())
	}

	///@private
	function focusChild (child) {
		this._propagateFocusToParents()
		this._focusChild(child)
	}

	///@private
	function setTransition(name, animation) {
		var backend = this._context.backend
		if (!backend.capabilities.csstransitions)
			return false

		var html5 = backend //remove me
		var transition = {
			property: html5.getPrefixedName('transition-property'),
			delay: html5.getPrefixedName('transition-delay'),
			duration: html5.getPrefixedName('transition-duration'),
			timing: html5.getPrefixedName('transition-timing-function')
		}

		name = html5.getPrefixedName(name) || name //replace transform: <prefix>rotate hack

		var property = this.style(transition.property) || []
		var duration = this.style(transition.duration) || []
		var timing = this.style(transition.timing) || []
		var delay = this.style(transition.delay) || []

		var idx = property.indexOf(name)
		if (idx === -1) { //if property not set
			property.push(name)
			duration.push(animation.duration + 'ms')
			timing.push(animation.easing)
			delay.push(animation.delay + 'ms')
		} else { //property already set, adjust the params
			duration[idx] = animation.duration + 'ms'
			timing[idx] = animation.easing
			delay[idx] = animation.delay + 'ms'
		}

		var style = {}
		style[transition.property] = property
		style[transition.duration] = duration
		style[transition.timing] = timing
		style[transition.delay] = delay

		//FIXME: smarttv 2003 animation won't work without this shit =(
		if (this._context.system.os === 'smartTV' || this._context.system.os === 'netcast') {
			style["transition-property"] = property
			style["transition-duration"] = duration
			style["transition-delay"] = delay
			style["transition-timing-function"] = timing
		}
		this.style(style)
		return true
	}

	///@private
	function _updateStyle() {
		var element = this.element
		if (element)
			element.updateStyle()
	}

	///@private
	function _enqueueNextChildInFocusChain(queue, handlers) {
		this._tryFocus() //soft-restore focus for invisible components
		var focusedChild = this.focusedChild
		if (focusedChild && focusedChild.visible) {
			queue.unshift(focusedChild)
			handlers.unshift(focusedChild)
		}
	}

	///@private
	function _processKey(event) {
		var key = _globals.core.keyCodes[event.which || event.keyCode];
		if (key) {
			//fixme: create invoker only if any of handlers exist
			var invoker = _globals.core.safeCall(this, [key, event], function (ex) { log("on " + key + " handler failed:", ex, ex.stack) })
			var proto_callback = this['__key__' + key]

			if (key in this._pressedHandlers) {
				var handlers = this._pressedHandlers[key]
				for(var i = handlers.length - 1; i >= 0; --i) {
					var callback = handlers[i]
					if (invoker(callback)) {
						if (_globals.core.trace.key)
							log("key", key, "handled by", this, new Error().stack)
						return true;
					}
				}
			}

			if (proto_callback)
				invoker(proto_callback)

			var proto_callback = this['__key__Key']
			if ('Key' in this._pressedHandlers) {
				var handlers = this._pressedHandlers['Key']
				for(var i = handlers.length - 1; i >= 0; --i) {
					var callback = handlers[i]
					if (invoker(callback)) {
						if (_globals.core.trace.key)
							log("key", key, "handled by", this, new Error().stack)
						return true
					}
				}
			}
			if (proto_callback)
				invoker(proto_callback)
		}
		else {
			log("unknown key", event.which);
		}
		return false;
	}

	/// focus this item
	setFocus: { this.forceActiveFocus() }
}
