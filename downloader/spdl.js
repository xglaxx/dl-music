"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diretory = __dirname;
const BASE_URL = 'https://api.spotify.com/v1/';
exports.Spotify = void 0;
exports.Spotify = class Spotify {
	constructor({ query, limitSearch, clientId, clientSecret, classConfig }) {
		Object.assign(this, classConfig)
		this.query = query || ''
		this.limitSearch = typeof limitSearch === 'number' ? Math.min(limitSearch, 25) : 25
		this._timestamp = this.access_token = this.token_type = null
		this._id = clientId || null
		this._secret = clientSecret || null
	}
	
	getToken() {
		const Dir = diretory+'/tokens/spotify.json'
		if (!(this._id && this._secret)) return Promise.reject('Sem token!')
		try {
			const data = JSON.parse(this.read(Dir).toString('utf8'))
			this._timestamp = data?.timestamp
			this.token_type = data?.type
			this.acess_token = data?.token
		} catch (error) {
			//console.error('spotify-token.error:', error)
		}
		
		const date = Date.now() - Number(this._timestamp)
		const encode = new Buffer.from(`${this._id}:${this._secret}`).toString("base64")
        return date >= (1000 * 60 * 60) ? this.getInfoUrlPost("https://accounts.spotify.com/api/token", {
			json: true,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': 'Basic ' + encode
			},
			form: { grant_type: 'client_credentials' }
			//form: { grant_type: 'authorization_code' }
		}).then(body => {
			this.token_type = body.token_type
			this.access_token = body.access_token
			this._timestamp = Date.now()
			this.write(Dir, {
				token: this.access_token,
				type: this.token_type,
				timestamp: this._timestamp
			})
			console.log('spotify-token.update:', body)
			return Promise.resolve(this.access_token)
		}) : Promise.resolve(this.access_token)
    };
    
    get(query = this.query) {
    	if (this.isUrl(query)) {
    		return this.getInfoUrl(query)
    	} else {
    		return this.search(query)
    	}
    };
	
	async search(query = this.query) {
		await this.getToken()
		return this.getHTML(BASE_URL+'search?q='+encodeURIComponent(query)+'&type=album%2Cplaylist%2Cartist%2Ctrack&limit='+this.limitSearch, {
			method: 'GET',
			json: true,
			headers: { 'Authorization': `${this.token_type} ${this.access_token}` }
		}).then(({ tracks, playlists, artists, albums }) => {
			tracks = this.formatObject(tracks.items, 'track')
			playlists = this.formatObject(playlists.items, 'playlist')
			artists = this.formatObject(artists.items, 'artist')
			albums = this.formatObject(albums.items, 'album')
			return Promise.resolve({ tracks, playlists, artists, albums })
		})
	};
	
	async getProfile(url) {
		if (this.isUrl(url) && /\/user\//.test(url)) {
			return this.getInfoUrl(url)
		} else {
			await this.getToken()
			return this.fetch(BASE_URL+'me', {
				headers: { 'Authorization': `${this.token_type} ${this.access_token}` }
			}).then(v => v.json()).then(v => this.formatObject(v, 'user'))
		}
	};
	
	async getInfoUrl(url = this.query) {
		url = this.isUrl(url)
		if (!(
			url && url[0].includes('spotify')
		)) return Promise.reject('Necessita ser uma URL Spotify.')
		if (url[0].includes('spotify.link')) {
			url = await this.getOriginalUrl(url[0])
		} else {
			url = url[0]
		}
		
		const type = /\/playlist\//.test(url) ? 'playlists/' : /\/album\//.test(url) ? 'albums/' : /\/track\//.test(url) ? 'tracks/' : /\/artist\//.test(url) ? 'artists/' : /\/user\//.test(url) && 'users/'
		if (!type) return Promise.reject('Não foi reconhecido a url.')
		
		await this.getToken()
		const id = url.split(/(track|album|playlist|artist|user)\//g).pop().split("?")[0]
		return this.getHTML(BASE_URL+type+id, {
			method: 'GET',
			json: true,
			headers: { 'Authorization': `${this.token_type} ${this.access_token}` }
		}).then(v => {
			let data = v
			if (/playlist|album/.test(v.type)) {
				data = {
					...this.formatObject(v, v.type),
					tracks: this.formatObject(v.tracks.items.map(o => Object.assign(o, {
						'total_tracks': (v['total_tracks'] || 1),
						'release_date': (v['release_date'] || 1)
					})), 'track')
				}
			} else {
				data = this.formatObject(v, v.type)
			}
			data.type = v.type
			return Promise.resolve(data)
		});
	};
	
	formatObject(items, type) {
		if (Array.isArray(items)) {
			return items.map((o, i) => this.formatObject(o, type))
		} else {
			switch (type) {
				case 'track': case 'tracks':
					const ss = `${items['duration_ms']}`
					const s = ss.substr(-ss.length, ss.length - 3)
					const item = items.album || items
					return {
						id: items.id,
						title: items.name,
						image: this.highQualityImage(items?.images),
						publishedAt: new Date(item['release_date']),
						date: item['release_date'],
						timestamp: this.convertSforM(s),
						seconds: Number(s),
						...(item.artists ? { author: this.formatObject(item.artists[0], 'artist') } : {}),
						url: items['external_urls'].spotify,
						track: items['track_number']+'/'+item['total_tracks'],
						download: () => this.spotifydown(items['external_urls'].spotify)
					}
				case 'playlist': case 'playlists':
					const data = this.formatObject(items, 'artist')
					return Object.assign(data, {
						total: (items?.total || 0),
						get: () => this.get(data.url)
					})
				case 'album': case 'albums':
					return {
						...this.formatObject(items, 'artist'),
						publishedAt: new Date(items['release_date']),
						date: items['release_date']
					}
				case 'artist': case 'artists': case 'user': case 'users':
					return {
						id: items.id,
						url: items['external_urls'].spotify,
						name: (items?.name || item?.display_name || ''),
						image: this.highQualityImage(items?.images),
						genres: (items?.genres || []),
						followers: (items.followers?.total || 0)
					}
				default:
				return items
			}
		}
	};
	
	highQualityImage(array) {
		if (!(Array.isArray(array) && array.length)) return ''
		array.sort((a, b) => (Number(a.height) < Number(b.height)) ? 1 : -1)
		return array[0].url
	};
	
	updateToken() {
		return setInterval(async () => {
			await this.getToken()
		}, 10 * 1000)
	};
	
}