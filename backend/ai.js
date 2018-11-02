const querystring = require('querystring')
const crypto = require('crypto')
const R = require('ramda')
const fetch = require('node-fetch')
const { mp3ToWavWith16kSampleRate, wavToWavWith16kSampleRate } = require('./resampler')

function md5(str) {
	return crypto.createHash('md5').update(str).digest('hex')
}

function base64(obj) {
	let str
	if (obj instanceof Buffer) {
		str = obj
	} else if (typeof obj === 'object') {
		str = JSON.stringify(obj)
	}
	return Buffer.from(str).toString('base64')
}

class XFClient {
	constructor(appid, keys = {}) {
		this.appid = appid
		this.keys = keys
	}

	setKey(url, key) {
		this.keys[url] = key
	}

	async post(url, xParam, body) {
		const options = {
			method: 'POST',
			mode: 'cors',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
			},
			body,
		}
		options.headers['X-Appid'] = this.appid
		options.headers['X-CurTime'] = Math.floor(Date.now() / 1000)
		options.headers['X-Param'] = base64(xParam)
		options.headers['X-CheckSum'] = md5(this.keys[url.split(/\//).pop()] + options.headers['X-CurTime'] + options.headers['X-Param'])
		console.debug(url, JSON.stringify(R.pickAll(['method', 'headers'], options)))

		const rs = await fetch(url, options)
		const contentType = rs.headers.get('content-type')
		let resBody
		let printBody
		if (contentType.indexOf('text/plain') !== -1) {
			resBody = await rs.json()
			printBody = JSON.stringify(resBody)
		} else if (contentType.indexOf('audio/mpeg') !== -1) {
			printBody = await rs.arrayBuffer()
			resBody = Buffer.from(printBody)
		} else {
			resBody = await rs.text()
			printBody = resBody
		}
		console.debug(url, rs.status, contentType, printBody)
		return resBody
	}

	tts(xParam, text) {
		return this.post('http://api.xfyun.cn/v1/service/v1/tts', xParam, querystring.stringify({ text }))
	}

	iat(xParam, audio) {
		return this.post('http://api.xfyun.cn/v1/service/v1/iat', xParam, querystring.stringify({ audio: base64(audio) }))
	}

	currency(xParam, body) {
		return this.post('http://tupapi.xfyun.cn/v1/currency', xParam, body)
	}

	async aiui(xParam, body) {
		if (xParam.data_type === 'text') {
			const rs = await this.post('https://openapi.xfyun.cn/v2/aiui', xParam, body)
			return rs
		} else if (xParam.data_type === 'audio') {
			let wav16k = null
			if (xParam.format === 'mp3') {
				wav16k = await mp3ToWavWith16kSampleRate(Buffer.from(body, 'base64'))
				console.debug('mp3ToWavWith16kSampleRate', wav16k)
			} else if (xParam.format === 'wav') {
				wav16k = await wavToWavWith16kSampleRate(Buffer.from(body, 'base64'))
				console.debug('wavToWavWith16kSampleRate', wav16k)
			} else {
				throw new Error(`unsupport format ${xParam.format}`)
			}
			delete xParam.format
			xParam.sample_rate = '16000'
			const rs = await this.post('https://openapi.xfyun.cn/v2/aiui', xParam, wav16k)
			return rs
		}
		throw new Error(`unsupport data_type ${xParam.data_type}`)
	}
}

module.exports = { XFClient }
