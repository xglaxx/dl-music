(async () => {
	const Downloader = require('dl-music').default
	const dl = new Downloader({
		/*
		type: 'soundcloud', // youtube | spotify  (opcional)
		*/
		query: 'https://on.soundcloud.com/8rHfd',
		clientId: '3c7173a21c9a4f3a8b2880456e33f248', // Spotify
		clientSecret: '8dcac80e85034e22bb7c67dd992c05cc' // Spotify
	})
	await dl.download().get().then(console.log).catch(console.error)
})()
