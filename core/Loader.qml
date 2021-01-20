/// object that helps loading components dynamically
Item {
	signal loaded;				///< when requested component it loaded event signal
	property string source;		///< component's URL
	property Object item;		///< item for storing requested component

	///@private
	function discardItem() {
		var item = this.item
		if (item) {
			item.discard()
			item = null
		}
	}

	///@private
	function discard() {
		this.discardItem()
		_globals.core.Item.prototype.discard.call(this)
	}

	///@internal
	onSourceChanged: {
		this.discardItem()
		this._load()
	}

	///@internal
	function _load() {
		var source = this.source
		if (!source)
			return

		log('loading ' + source + '...')
		var path = source.split('.')
		var ctor = _globals
		while(path.length) {
			var ns = path.shift()
			ctor = ctor[ns]
			if (ctor === undefined)
				throw new Error('unknown component used: ' + source)
		}
		var item = new ctor(this)
		var c = {}
		item.$c(c)
		item.$s(c)
		this.item = item
		this._context._complete()
		this._updateVisibilityForChild(this.item, this.recursiveVisible)
		this.loaded()
	}

	onRecursiveVisibleChanged: {
		if (this.item)
			this._updateVisibilityForChild(this.item, value)
	}

	///@internal
	onCompleted: {
		this._load()
	}
}
