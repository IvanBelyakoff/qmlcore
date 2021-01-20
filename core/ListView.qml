BaseView {
	property int orientation;
	property int spacing;

	move(dx, dy): {
		var horizontal = this.orientation == this.Horizontal
		if (horizontal)
			this.contentX += dx
		else
			this.contentY += dy
	}

	onKeyPressed: {
		var horizontal = this.orientation == this.Horizontal
		if (horizontal) {
			if (key == 'Left') {
				--this.currentIndex;
				return true;
			} else if (key == 'Right') {
				++this.currentIndex;
				return true;
			}
		} else {
			if (key == 'Up') {
				--this.currentIndex;
				return true;
			} else if (key == 'Down') {
				++this.currentIndex;
				return true;
			}
		}
	}

	getItemPosition(idx): {
		var items = this._items
		var item = items[idx]
		if (!item) {
			var x = 0, y = 0, w = 0, h = 0
			for(var i = idx; i >= 0; --i) {
				if (items[i]) {
					item = items[i]
					x = item.viewX + item.x
					y = item.viewY + item.y
					w = item.width
					h = item.height
					break
				}
			}
			var missing = idx - i
			if (missing > 0) {
				x += missing * (w + this.spacing)
				y += missing * (h + this.spacing)
			}
			return [x, y, w, h]
		}
		else
			return [item.viewX + item.x, item.viewY + item.y, item.width, item.height]
	}

	indexAt(x, y): {
		var items = this._items
		x += this.contentX
		y += this.contentY
		if (this.orientation == ListView.Horizontal) {
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
	onOrientationChanged: { this._layout() }
}
