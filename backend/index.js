const { start } = require('./api.js')

const port = process.env.PORT || 8081

start(port)
	.then(() => console.log(`Server start port=${port}`))
	.catch(console.error)
