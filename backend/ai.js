const querystring = require('querystring')
const crypto = require('crypto')
const R = require('ramda')
const fetch = require('node-fetch')

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
		console.log(url, JSON.stringify(R.pickAll(['method', 'headers'], options)))

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
		console.log(url, rs.status, contentType, printBody)
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
			const rs = await this.post('https://openapi.xfyun.cn/v2/aiui', xParam, Buffer.from(body, 'base64'))
			return rs
		}
		throw new Error(`unsupport data_type ${xParam.data_type}`)
	}
}

class TLClient {
	constructor(apiKey) {
		this.apiKey = apiKey
	}

	async chat(text, { userId = 'anonymous' } = {}) {
		const url = 'http://openapi.tuling123.com/openapi/api/v2'
		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
			},
			body: JSON.stringify({
				reqType: 0,
				perception: { inputText: { text } },
				userInfo: { apiKey: this.apiKey, userId },
			}),
		}
		console.log(url, JSON.stringify(R.pickAll(['method', 'body'], options)))
		const rs = await fetch(url, options)
		const json = await rs.json()
		console.log(url, rs.status, rs.headers.get('content-type'), JSON.stringify(json))
		return json
	}

}

module.exports = { XFClient, TLClient }
