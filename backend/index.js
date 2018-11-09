const { start, getApp } = require('./api.js')
const serverless = require('serverless-http')

if (process.env.IS_SERVERLESS) {
	module.exports.handler = serverless(getApp())
} else {
	const port = process.env.PORT || 8081
	start(port)
		.then(() => console.log(`Server start port=${port}`))
		.catch(console.error)
}
