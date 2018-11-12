import MR from 'audio-recorder-polyfill'
import R from 'ramda'
import toWav from 'audiobuffer-to-wav'
import ndarray from 'ndarray'
import resample from 'ndarray-resample'

const AudioContext = window.AudioContext || window.webkitAudioContext
window.AudioContext = AudioContext // fix bug for mic-recorder-to-mp3

import MicRecorder from 'mic-recorder-to-mp3' // eslint-disable-line

const { webkitSpeechRecognition, speechSynthesis, SpeechSynthesisUtterance, navigator: { mediaDevices } } = window
let { MediaRecorder } = window
if (typeof MediaRecorder === 'undefined') {
	MediaRecorder = MR
}
const DEFAULT_TIMEOUT = 3

function getMonoAudio(audioBuffer) {
	if (audioBuffer.numberOfChannels === 1) {
		return audioBuffer.getChannelData(0)
	}
	if (audioBuffer.numberOfChannels !== 2) {
		throw Error(`${audioBuffer.numberOfChannels} channel audio is not supported.`)
	}
	const ch0 = audioBuffer.getChannelData(0)
	const ch1 = audioBuffer.getChannelData(1)

	const mono = new Float32Array(audioBuffer.length)
	for (let i = 0; i < audioBuffer.length; i += 1) {
		mono[i] = (ch0[i] + ch1[i]) / 2
	}
	return mono
}

function resampleAudioBuffer(audioBuffer, sampleRate) {
	const lengthRes = audioBuffer.length * (sampleRate / audioBuffer.sampleRate)
	const resampledAudio = new Float32Array(lengthRes)
	const originalAudio = getMonoAudio(audioBuffer)
	resample(
		ndarray(resampledAudio, [lengthRes]),
		ndarray(originalAudio, [originalAudio.length])
	)
	return resampledAudio
}

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
					try {
						new AudioContext().decodeAudioData(reader.result, (audioBuffer) => {
							try {
								const resampledAudio = resampleAudioBuffer(audioBuffer, 16000)
								const wav = toWav({ getChannelData: () => resampledAudio, numberOfChannels: 1, sampleRate: 16000 })
								resolve(new Blob([wav], { type: 'audio/wav' }))
							} catch (e) { reject(e) }
						})
					} catch (e) { reject(e) }
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
