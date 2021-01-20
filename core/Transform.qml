/// class controlling object transformation
Object {
	property int perspective;	///< perspective transformation
	property int translateX;	///< x-translate
	property int translateY;	///< y-translate
	property int translateZ;	///< z-translate
	property real rotateX;		///< x-axis rotation
	property real rotateY;		///< y-axis rotation
	property real rotateZ;		///< z-axis rotation
	property real rotate;		///< rotate relative transform point
	property real scaleX;		///< horizontal scale
	property real scaleY;		///< vertical scale
	property real skewX;		///< horizontal skew
	property real skewY;		///< vertical skew

	///@private
	constructor: { this._transforms = {} }

	///@private
	function _update(name, value) {
		switch(name) {
			case 'perspective':	this._transforms['perspective'] = value + 'px'; break;
			case 'translateX':	this._transforms['translateX'] = value + 'px'; break;
			case 'translateY':	this._transforms['translateY'] = value + 'px'; break;
			case 'translateZ':	this._transforms['translateZ'] = value + 'px'; break;
			case 'rotateX':	this._transforms['rotateX'] = value + 'deg'; break
			case 'rotateY':	this._transforms['rotateY'] = value + 'deg'; break
			case 'rotateZ':	this._transforms['rotateZ'] = value + 'deg'; break
			case 'rotate':	this._transforms['rotate'] = value + 'deg'; break
			case 'scaleX':	this._transforms['scaleX'] = value; break
			case 'scaleY':	this._transforms['scaleY'] = value; break
			case 'skewX':	this._transforms['skewX'] = value + 'deg'; break
			case 'skewY':	this._transforms['skewY'] = value + 'deg'; break
		}

		var str = ""
		for (var i in this._transforms) {
			str += i
			str += "(" + this._transforms[i] + ") "
		}
		this.parent.style('transform', str)
		_globals.core.Object.prototype._update.apply(this, arguments)
	}
}
