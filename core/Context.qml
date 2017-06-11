///root item
Item {
	property int scrollY;		///< scrolled page vertical offset value
	property bool fullscreen;	///< fullscreen mode enabled / disabled
	property string language;	///< localisation language
	property System system: System { }					///< system info object
	property Location location: Location { }			///< web-page location object
	property Stylesheet stylesheet: Stylesheet { }		///< @private
	property Orientation orientation: Orientation { }	///< screen orientation object

	visibleInView: false; //startup

	///@private
	constructor: {
		this.options = arguments[2]
		this.l10n = this.options.l10n || {}

		this._local['context'] = this
		this._prefix = this.options.prefix
		this._context = this
		this._started = false
		this._completed = false
		this._processingActions = false
		this._delayedActions = []
		this._stylesRegistered = {}
		this._updateHandlers = null

		this.backend = _globals._backend()
	}

	///@private
	function getClass(name) {
		return this._prefix + name
	}

	///@private
	function registerStyle(item, tag) {
		if (!(tag in this._stylesRegistered)) {
			item.registerStyle(this.stylesheet, tag)
			this._stylesRegistered[tag] = true
		}
	}

	///@private
	function createElement(tag) {
		var el = this.backend.createElement(this, tag)
		if (this._prefix) {
			el.addClass(this.getClass('core-item'))
		}
		return el
	}

	///@private
	function init() {
		log('Context: initializing...')
		new this.backend.init(this)
	}

	///@private
	function _onCompleted(callback) {
		this.scheduleAction(callback);
	}

	onFullscreenChanged: { if (value) this.backend.enterFullscreenMode(this.element); else this.backend.exitFullscreenMode(); }

	///@private
	function _callHandlers(invoker, handlers) {
		if (handlers.length === 0)
			return

		if (this._updateHandlers !== null) {
			this._updateHandlers.push({i: invoker, h: handlers})
			return
		}

		this._updateHandlers = []
		handlers.forEach(invoker)
		while(this._updateHandlers.length) {
			var handlers = this._updateHandlers
			this._updateHandlers = []
			handlers.forEach(function(cb) {
				cb.h.forEach(cb.i)
			})
		}
		this._updateHandlers = null
	}

	///@private
	function _complete() {
		this._processActions()
		this._completed = true
	}

	///@private
	function start(instance) {
		var closure = {}
		this.children.push(instance)
		instance.__create(closure)
		instance.__setup(closure)
		closure = undefined
		log('Context: created instance')
		this._started = true
		// log('Context: calling on completed')
		log('Context: signalling layout')
		this.boxChanged()
		log('Context: done')
		return instance;
	}

	///@private
	function _processActions() {
		if (!this._started || this._processingActions)
			return

		this._processingActions = true

		var invoker = _globals.core.safeCall(this, [], function (ex) { log("async action failed:", ex, ex.stack) })
		while (this._delayedActions.length) {
			var actions = this._delayedActions
			this._delayedActions = []
			actions.forEach(invoker)
		}

		this._processingActions = false
		this._delayedTimeout = undefined
	}

	///@private
	function scheduleAction(action) {
		this._delayedActions.push(action)
		if (this._completed && this._delayedTimeout === undefined)
			this._delayedTimeout = setTimeout(this._processActions.bind(this), 0)
	}

	/**@param text:string text that must be translated
	Returns input text translation*/
	function qsTr(text) {
		var args = arguments
		var lang = this.language
		var messages = this.l10n[lang] || {}
		var contexts = messages[text] || {}
		for(var name in contexts) {
			text = contexts[name] //fixme: add context handling here
			break
		}
		return text.replace(/%(\d+)/, function(text, index) { return args[index] })
	}

	///@private
	function run() {
		this.backend.run(this, this._run.bind(this))
	}

	///@private
	function _run() {
		log('Context: calling completed()')
		this._complete()
		this.visibleInView = true
	}
}
