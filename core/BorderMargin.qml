/**
@internal
Margin for one size of the border
*/

Object {
	property string name;
	property int margin;
	property color color;

	function _updateStyle() {
		if (this.parent && this.parent.parent) {
			var pp = this.parent.parent
			if (pp) {
				var cssname = 'border-' + this.name
				if (this.margin) {
					pp.style(cssname, this.margin + "px solid " + new _globals.core.Color(this.color).get())
				} else
					pp.style(cssname, '')
			}
		}
	}

	function _update(name, value) {
		switch(name) {
			case 'margin': this._updateStyle(); break
			case 'color': this._updateStyle(); break
		}
		_globals.core.Object.prototype._update.apply(this, arguments);
	}
}
