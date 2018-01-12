/*** @using { core.RAIIEventEmitter } **/

const observable = require("data/observable")
const Observable = observable.Observable

const layout = require('ui/layouts/absolute-layout')
const AbsoluteLayout = layout.AbsoluteLayout

const label = require('ui/label')
const Label = label.Label

const image = require('ui/image')
const Image = image.Image

function dekebabize(name) {
	return name.replace(/-([a-z])/g, (g) => { return g[1].toUpperCase() })
}

const translate = {
	left: (layout, name, value) => {
		layout[name] = value
		AbsoluteLayout.setLeft(layout, value)
	},

	top: (layout, name, value) => {
		layout[name] = value
		AbsoluteLayout.setTop(layout, value)
	},

	visibility: (layout, name, value) => {
	}
}


class Element extends _globals.core.RAIIEventEmitter {
	constructor(layout, impl) {
		super()
		this.layout = layout
		this.impl = impl
	}

	append(el) {
		this.layout.addChild((el instanceof Element)? el.layout: el)
	}

	remove() {
		let layout = this.layout
		let parent = layout.parent
		if (parent)
			parent.removeChild(layout)
	}

	addClass(name) {
		//log('Element.addClass', name)
	}

	style(target, value) {
		if (typeof target === 'object') {
			for(let k in target) {
				this.style(k, target[k])
			}
		} else {
			let layout = this.layout
			let name = dekebabize(target)
			if (value !== undefined) {
				if (name in layout) {
					if (name in translate) {
						translate[name](layout, name, value)
					} else
						layout[name] = value
				} else
					log('skipping style', name)
			} else {
				return layout[name]
			}
		}
	}
}

let context = null
let page = null
let finalization_callback = null

exports.capabilities = {}
exports.init = function(ctx) {
	log('backend initialization...')
	context = ctx
	const options = ctx.options
	const nativeContext = options.nativeContext
	const parentLayout = nativeContext.getViewById(options.id)
	if (!parentLayout)
		throw new Error('could not find view with id ' + options.id)

	page = nativeContext
	ctx.element = new Element(parentLayout, null)

	log('page size: ', page.getMeasuredWidth(), 'x', page.getMeasuredHeight())
	context.width = page.getMeasuredWidth()
	context.height = page.getMeasuredHeight()
}


exports.run = function(ctx, callback) {
	finalization_callback = callback
}

exports.finalize = function() {
	finalization_callback()
	finalization_callback = null
}

exports.initSystem = function(system) {
}

exports.createElement = function(ctx, tag, cls) {
	//log('creating element', tag, cls)
	let impl
	switch(cls) {
		case 'core-text':
			impl = new Label()
			break
		case 'core-image':
			impl = new Image()
			break
		default:
			impl = null
	}
	return new Element(new AbsoluteLayout(), impl)
}

exports.initImage = function(image) {
}

var ImageStatusNull			= 0
var ImageStatusLoaded		= 1
var ImageStatusUnloaded		= 2
var ImageStatusError		= 3


exports.loadImage = function(image) {
	log('loading image ' + image.source)
	let source
	if (image.source.indexOf('://') >= 0)
		source = image.source
	else if (source)
		source = '~/' + image.source
	else
		source = ''
	if (image.impl)
		image.impl.imageSource = source
}

exports.initText = function(text) {
}

exports.setText = function(text, html) {
	if (text.impl)
		text.impl.text = html
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
