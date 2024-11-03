"use strict";
module.exports = class ClassConfig {
	constructor(c) {
		this._path(c)
	};
	
	_path(c) {
		if (typeof c === 'string') {	
			return this._path({ query: c });
		}
		
		const ty = c.type || c.source || this.type
		const fm = c.format || c.formato || this.format
		const sh = Number(c.limitSearch || c.maxSearch || this.limitSearch)
		const py = Number(c.limitPlayList || c.maxPlaylist || this.limitPlayList)
		this.query = c.query || c.pesquisar || c.url || this.query || 'Quase - Banda 007'
		this.format = /mp3|mp4/.test(fm) ? fm : 'mp3'
		this.randomSelect = Boolean(c.randomSelect || c.random || this.randomSelect)
		this.dir = c.localFile || c.dir || || this.dir || ''
		this.downloadFile = Boolean(c.downloadFile || this.downloadFile)
		this.seconds = Number(c.limitSeconds || c.maxSeconds || this.seconds || 0)
		this.limitPlayList = py >= 1 ? py : 100
		this.limitSearch = sh >= 1 ? sh : 1
		this.clientId = c.id || c.clientId || this.clientId || '' // Token id [Spotify]
		this.clientSecret = c.secret || c.clientSecret || this.clientSecret || '' // Token secret [Spotify]
		this.type = /spotify|soundcloud|/.test(ty) ? ty : 'youtube'
	};
	
};