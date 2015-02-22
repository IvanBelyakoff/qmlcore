Item {
	property bool	autoPlay;
	property string	source;

	play: {
		this._player.get(0).play()
	}

	onSourceChanged: {
		console.log("source changed to", this.source)
		this._player.attr('src', this.source)
	}

	onWidthChanged: {
		if (this._player)
			this._player.attr('width', this.width)
	}

	onHeightChanged: {
		if (this._player)
			this._player.attr('height', this.height)
	}

	onCompleted: {
		this._player = $('<video preload="metadata" width="' + this.width +
			'" height="' + this.height +
			'" src="' + this.src +
			'" ' + (this.autoPlay? "autoplay": "") + '>')
		this._player.css('background-color', 'purple')
		this.element.append(this._player)
	}
}
