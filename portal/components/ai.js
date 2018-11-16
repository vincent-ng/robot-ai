const crypto = require('crypto')
const R = require('ramda')
const { fetch } = require('whatwg-fetch')

// const SERVER_BASE = 'https://v3w3ozjzk7.execute-api.ap-southeast-1.amazonaws.com/dev/api'
// const SERVER_BASE = 'https://wt-18e127c6f4b8a13508b25fa5c646c8a2-0.sandbox.auth0-extend.com/robot-ai/api'
const SERVER_BASE = '/api'

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

function toBase64(blob) {
	return new Promise((resolve) => {
		const reader = new FileReader()
		reader.readAsDataURL(blob)
		reader.onloadend = () => resolve(reader.result.split('base64,')[1])
	})
}

async function talkToAI(speech, { emptyInput = '', emptyOutput = '' }) {
	if (!speech) {
		return { input: '', output: emptyInput }
	}
	let rs
	try {
		if (speech instanceof Blob) {
			rs = await post('aiui', {
				scene: 'main',
				auth_id: md5('vincent'),
				sample_rate: '16000',
				data_type: 'audio',
			}, await toBase64(speech))
		} else {
			rs = await post('aiui', {
				scene: 'main',
				auth_id: md5('vincent'),
				data_type: 'text',
			}, speech)
		}
		const { source, req: input, res } = JSON.parse(rs)
		if (source === 'xunfei') {
			const answers = R.filter(e => e.intent && e.intent.answer, res.data || [])
			const answer = R.pathOr(emptyOutput, [0, 'intent', 'answer', 'text'], answers)
			return { input, output: answer.replace(/\[\w+\]/g, '') }
		} else if (source === 'tuling') {
			const answers = R.filter(e => e.resultType === 'text', res.results || [])
			const answer = R.map(e => e.values.text, answers).join(' ')
			return { input, output: answer }
		}
		throw new Error(`unknow source ${source}`)
	} catch (e) {
		console.error(e)
		return { input: '', output: emptyOutput }
	}
}

export default { talkToAI }
