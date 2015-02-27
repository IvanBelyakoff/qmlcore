BaseView {
	property int flow;

	property int cellWidth: 100;
	property int cellHeight: 100;

	property int rows;
	property int columns;

	move(dx, dy): {
		this.contentX += dx
		this.contentY += dy
	}

	onKeyPressed: {
		var horizontal = this.flow == this.FlowLeftToRight
		if (horizontal) {
			switch(key) {
				case 'Up':		--this.currentIndex; break;
				case 'Down':	++this.currentIndex; break;
				case 'Left':	this.currentIndex -= this.rows; break;
				case 'Right':	this.currentIndex += this.rows; break;
			}
		} else {
			switch(key) {
				case 'Left':	--this.currentIndex; break;
				case 'Right':	++this.currentIndex; break;
				case 'Up':		this.currentIndex -= this.columns; break;
				case 'Down':	this.currentIndex += this.columns; break;
			}
		}
	}

	getItemPosition(idx): {
		var horizontal = this.flow == this.FlowLeftToRight
		var x, y, cw = this.cellWidth, ch = this.cellHeight
		if (horizontal) {
			if (this.rows == 0)
				return [0, 0, 0, 0]
			x = Math.floor(idx / this.rows) * cw
			y = (idx % this.rows) * ch
		} else {
			if (this.rows == 0)
				return [0, 0, 0, 0]
			x = Math.floor(idx / this.columns) * cw
			y = (idx % this.columns) * ch
		}
		return [x, y, cw, ch]
	}

	focusCurrent: {
		var n = this.count
		if (n == 0)
			return

		var idx = this.currentIndex
		if (idx < 0 || idx >= n) {
			if (this.keyNavigationWraps)
				this.currentIndex = (idx + n) % n
			else
				this.currentIndex = idx < 0? 0: n - 1
			return
		}
		var item = this._items[idx]
		this.positionViewAtIndex(idx)
		if (item)
			this.focusChild(item)
	}

	indexAt(x, y): {
		var items = this._items
		var horizontal = this.flow == this.FlowLeftToRight
		if (horizontal) {
			for (var i = 0; i < items.length; ++i) {
				var item = items[i]
				if (!item)
					continue
				var vx = item.viewX
				if (x >= vx && x < vx + item.width)
					return i
			}
		} else {
			for (var i = 0; i < items.length; ++i) {
				var item = items[i]
				if (!item)
					continue
				var vy = item.viewY
				if (y >= vy && y < vy + item.height)
					return i
			}
		}
		return -1
	}

	onFlowChanged: { this._layout() }
}