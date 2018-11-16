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
const { XFClient, TLClient } = require('./ai.js')
const config = require('./config.js')

logger.hackConsole()

const xfClient = new XFClient(config.xunfei.appid)
xfClient.setKey('tts', config.xunfei.tts)
xfClient.setKey('iat', config.xunfei.iat)
xfClient.setKey('currency', config.xunfei.currency)
xfClient.setKey('aiui', config.xunfei.aiui)
const tlClient = new TLClient(config.tuling.apiKey)

const app = new Koa()
const router = new Router()

const limitString = (str = '', limit) => (str.length > limit ? `${str.substring(0, limit)}...` : str)

router.get('/', async (ctx) => {
	ctx.body = 'hello world'
})

router.post('/api', async (ctx) => {
	const { api, xparam, body } = ctx.data
	let source = 'xunfei'
	let res = await xfClient[api](xparam, body)
	const answers = res.data || []
	const input = R.pathOr(R.pathOr('', [0, 'text'], answers), [0, 'intent', 'text'], answers)
	let output = R.pathOr('', [0, 'intent', 'answer', 'text'], R.filter(e => e.intent && e.intent.answer, answers))

	if (api === 'aiui' && input && !output) {
		source = 'tuling'
		res = await tlClient.chat(input, { userId: xparam.auth_id })
		output = R.map(e => e.values.text, R.filter(e => e.resultType === 'text', res.results || [])).join(' ')
	}
	ctx.body = { source, input, output, res }
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
		console.log(e)
		ctx.throw(e.StatusCode, e.message, { expose: true })
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
