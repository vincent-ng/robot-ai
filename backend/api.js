/* eslint-disable no-console */
const http = require('http')
const R = require('ramda')
const Koa = require('koa')
const cors = require('@koa/cors')
const Router = require('koa-router')
const koaBody = require('koa-body')
const qs = require('koa-qs')
const compress = require('koa-compress')
const logger = require('@brickyard/logger')
const { XFClient } = require('./ai.js')
const config = require('./config.js')

logger.hackConsole()

const client = new XFClient(config.keys.appid)
client.setKey('tts', config.keys.tts)
client.setKey('iat', config.keys.iat)
client.setKey('currency', config.keys.currency)
client.setKey('aiui', config.keys.aiui)

const app = new Koa()
const router = new Router()

class CommonError extends Error {
	constructor(code, msg) { super(msg); this.code = code }
	get StatusCode() { return this.code }
}

const limitString = (str = '', limit) => (str.length > limit ? `${str.substring(0, limit)}...` : str)

router.get('/', async (ctx) => {
	ctx.body = 'hello world'
})

router.post('/api', async (ctx) => {
	const { api, xparam, body } = ctx.data
	ctx.body = await client[api](xparam, body)
})

app.use(cors({ credentials: true }))
qs(app)
app.use(compress())
app.use(koaBody({ strict: false, jsonLimit: '10mb' }))
app.use(async (ctx, next) => {
	ctx.data = R.merge(ctx.request.query, ctx.request.body)
	await next()
})
app.use(async (ctx, next) => {
	try {
		console.log(`${ctx.ip} ${ctx.method} ${ctx.path} >> ${limitString(JSON.stringify(ctx.data), 512)}`)
		await next()
		console.log(`${ctx.ip} ${ctx.method} ${ctx.path} << ${ctx.status} ${limitString(JSON.stringify(ctx.body), 512)}`)
	} catch (e) {
		console.log(`${ctx.ip} ${ctx.method} ${ctx.path} << ${ctx.status} ${e.message}`)
		throw e
	}
})
app.use(async (ctx, next) => {
	try {
		await next()
	} catch (e) {
		if (e instanceof CommonError) {
			ctx.throw(e.StatusCode, e.message, { expose: true })
		} else {
			throw e
		}
	}
})

app.use(router.routes())
app.use(router.allowedMethods())

async function start(port) {
	if (port) {
		const server = http.createServer(app.callback())
		server.listen(port)
	}
}

module.exports = {
	getApp: () => app,
	start,
}
