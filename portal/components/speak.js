import R from 'ramda'

const { webkitSpeechRecognition, speechSynthesis, SpeechSynthesisUtterance } = window

function speakRecognition(timeout = 3) {
	const recognition = new webkitSpeechRecognition() // eslint-disable-line new-cap
	let stop = () => { throw new Error('can not call speakRecognition().stop before listern()') }
	const listern = () => new Promise((resolve) => {
		recognition.lang = 'cmn-Hans-CN'
		const handle = setTimeout(() => stop(), timeout * 1000)
		stop = () => {
			clearTimeout(handle)
			recognition.stop()
			resolve('')
		}
		recognition.onresult = (event) => {
			const rs = R.pathOr('', ['results', 0, 0, 'transcript'], event)
			clearTimeout(handle)
			resolve(rs)
		}
		recognition.start()
	})
	return {
		listern,
		stop: () => stop(),
	}
}

function speak(text, voice) {
	const utter = new SpeechSynthesisUtterance(text)
	const voices = speechSynthesis.getVoices()
	utter.voice = R.find(R.propEq('name', voice))(voices) || R.find(R.propEq('default', true))(voices)
	utter.pitch = 1.1
	speechSynthesis.speak(utter)
}

export default { speakRecognition, speak }
