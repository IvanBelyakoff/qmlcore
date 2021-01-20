exports.capabilities = {}
exports.init = function(ctx) {
	log('backend initialization...')
	const options = ctx.options
	const nativeContext = options.nativeContext
	ctx._attachElement(nativeContext)
	ctx.width = nativeContext.width
	ctx.height = nativeContext.height
	log('window size', ctx.width, ctx.height)
}


exports.run = function(ctx, callback) {
	//schedule onload event
	callback()
}

exports.initSystem = function(system) {
}

exports.createElement = function(ctx, tag, cls) {
	return new fd.Element()
}

exports.initRectangle = function(rect) {
	rect._attachElement(new fd.Rectangle())
}

exports.initImage = function(image) {
	image._attachElement(new fd.Image())
}

var ImageStatusNull			= 0
var ImageStatusLoaded		= 1
var ImageStatusUnloaded		= 2
var ImageStatusError		= 3


exports.loadImage = function(image) {
	image.element.load(image.source, function(metrics) {
		if (metrics) {
			image.sourceWidth = metrics.width
			image.sourceHeight = metrics.height
			image.paintedWidth = metrics.width
			image.paintedHeight = metrics.height
		}
		else
			image._onError()
	})
}

exports.initText = function(text) {
	text._attachElement(new fd.Text())
}

exports.setText = function(text, html) {
	log('setText', html)
}

exports.layoutText = function(text) {
	log('layoutText')
}

exports.setAnimation = function (component, name, animation) {
	return false
}

exports.requestAnimationFrame = function(callback) {
	return setTimeout(callback, 0)
}

exports.cancelAnimationFrame = function (timer) {
	clearTimeout(timer)
}

exports.tick = function(ctx) {
}
