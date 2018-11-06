const AudioContext = window.AudioContext || window.webkitAudioContext
window.AudioContext = AudioContext // fix bug for mic-recorder-to-mp3

/* eslint-disable */
import MediaRecorder from 'audio-recorder-polyfill'
import R from 'ramda'
import toWav from 'audiobuffer-to-wav'
import MicRecorder from 'mic-recorder-to-mp3'
/* eslint-enable */

const { webkitSpeechRecognition, speechSynthesis, SpeechSynthesisUtterance, navigator: { mediaDevices } } = window
const DEFAULT_TIMEOUT = 3

function speechRecordToWav(timeout = DEFAULT_TIMEOUT) {
	let stop = () => { throw new Error('can not call speechRecord().stop before listern()') }
	const listern = () => new Promise((resolve, reject) => {
		mediaDevices.getUserMedia({ audio: true }).then((stream) => {
			const mediaRecorder = new MediaRecorder(stream)
			const chunks = []
			mediaRecorder.addEventListener('dataavailable', e => chunks.push(e.data))
			const handle = setTimeout(() => stop(), timeout * 1000)
			stop = () => {
				clearTimeout(handle)
				mediaRecorder.stop()
				mediaRecorder.stream.getAudioTracks().forEach(track => track.stop())
			}
			mediaRecorder.addEventListener('stop', () => {
				clearTimeout(handle)
				const typeWebm = 'audio/webm;codecs=opus'
				const typeOgg = 'audio/ogg;codecs=opus'
				const reader = new FileReader()
				reader.readAsArrayBuffer(new Blob(chunks, { type: MediaRecorder.isTypeSupported(typeWebm) ? typeWebm : typeOgg }))
				reader.addEventListener('loadend', () => {
					new AudioContext().decodeAudioData(reader.result, (buffer) => {
						const wav = toWav(buffer)
						resolve(new Blob([wav], { type: 'audio/wav' }))
					})
				})
			})
			mediaRecorder.start()
		}).catch(reject)
	})
	return {
		listern,
		stop: () => stop(),
	}
}

function speechRecordToMp3(timeout = DEFAULT_TIMEOUT) {
	const recorder = new MicRecorder({
		bitRate: 128,
	})
	let stop = () => { throw new Error('can not call speechRecord().stop before listern()') }
	const listern = () => new Promise((resolve, reject) => {
		recorder.start().then(() => {
			let handle = null
			handle = setTimeout(() => stop(), timeout * 1000)
			stop = () => {
				clearTimeout(handle)
				recorder.stop().getMp3().then(([, blob]) => {
					resolve(blob)
				}).catch(reject)
			}
		}).catch(reject)
	})

	return {
		listern,
		stop: () => stop(),
	}
}

function speechRecognition(timeout = DEFAULT_TIMEOUT) {
	const recognition = new webkitSpeechRecognition() // eslint-disable-line new-cap
	let stop = () => { throw new Error('can not call speechRecognition().stop before listern()') }
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

function speechRecord(format = '', timeout = DEFAULT_TIMEOUT) {
	if (format.toLowerCase() === 'mp3') {
		return speechRecordToMp3(timeout)
	} else if (format.toLowerCase() === 'wav') {
		return speechRecordToWav(timeout)
	} else if (format.toLowerCase() === 'txt') {
		return speechRecognition(timeout)
	}
	throw new Error(`unsupported speech engine ${format}`)
}

function speak(text, voice) {
	const utter = new SpeechSynthesisUtterance(text)
	const voices = speechSynthesis.getVoices()
	utter.voice = R.find(R.propEq('name', voice))(voices) || R.find(R.propEq('default', true))(voices)
	utter.pitch = 1.1
	speechSynthesis.speak(utter)
}

export default {
	speechRecognition,
	speechRecordToMp3,
	speechRecordToWav,
	speechRecord,
	speak,
}
