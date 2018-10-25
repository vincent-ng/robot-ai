const crypto = require('crypto')
const R = require('ramda')
const { fetch } = require('whatwg-fetch')

const SERVER_BASE = 'https://wt-18e127c6f4b8a13508b25fa5c646c8a2-0.sandbox.auth0-extend.com/robot-ai/api'
// const SERVER_BASE = 'https://172.16.2.30/api'

function md5(str) {
	return crypto.createHash('md5').update(str).digest('hex')
}

async function post(api, xparam, body) {
	const url = `${SERVER_BASE}/`
	const options = {
		method: 'POST',
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
		},
		body: JSON.stringify({ api, xparam, body }),
	}

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
	return resBody
}

async function talkToAI(speak, { emptySpeak = '', emptyAnswer = '' }) {
	if (!speak) {
		return emptySpeak
	}
	const rs = await post('aiui', {
		scene: 'main',
		auth_id: md5('vincent'),
		data_type: 'text',
	}, speak)
	const answer = R.pathOr(emptyAnswer, ['data', 0, 'intent', 'answer', 'text'], JSON.parse(rs))

	return answer.replace(/\[\w+\]/g, '')
}

export default { talkToAI }
