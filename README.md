(async () => {
	const Downloader = require('dl-music').default
	const dl = new Downloader({
		/*
		type: 'soundcloud', // youtube | spotify  (opcional)
		*/
		query: 'https://on.soundcloud.com/8rHfd',
		clientId: 'xxxx', // Spotify
		clientSecret: 'xxx' // Spotify
	})
	await dl.download().get().then(console.log).catch(console.error)
})()
