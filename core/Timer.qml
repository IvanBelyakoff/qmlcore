/// class handles periodic tasks
Object {
	signal triggered;					///< this signal triggered when timer fires

	property int interval: 1000;		///< interval, ms
	property bool repeat;				///< makes this timer periodic
	property bool running;				///< current timer status, true - running, false - paused
	property bool triggeredOnStart;		///< fire timer's signal on start or activation

	/// restart timer, activate if stopped
	restart:	{ this._restart(); this.running = true; }

	/// stops timer
	stop:		{ this.running = false; }

	/// starts timer
	start: {
		var oldRunning = this.running;
		this.running = true;
		if (this.triggeredOnStart && !oldRunning)
			this._emitTriggered();
	}

	/// @private
	onTriggered: { if (!this.repeat) this.running = false }

	/// @private
	onRunningChanged: {
		if (value && this.triggeredOnStart)
			this.triggered()
	}

	/// @private
	onCompleted: {
		if (this.running && this.triggeredOnStart)
			this.triggered()
	}

	/// @private
	function _update(name, value) {
		switch(name) {
			case 'running': this._restart(); break;
			case 'interval': this._restart(); break;
			case 'repeat': this._restart(); break;
		}
		_globals.core.Object.prototype._update.apply(this, arguments);
	}

	/// @private
	function _restart() {
		if (this._timeout) {
			clearTimeout(this._timeout);
			this._timeout = undefined;
		}
		if (this._interval) {
			clearTimeout(this._interval);
			this._interval = undefined;
		}

		if (!this.running)
			return;

		//log("starting timer", this.interval, this.repeat);
		var self = this;
		if (this.repeat)
			this._interval = setInterval(function() { self.triggered(); }, this.interval);
		else
			this._timeout = setTimeout(function() { self.triggered(); }, this.interval);
	}

}
