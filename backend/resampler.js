const lame = require('lame')
const wav = require('wav')
const fs = require('fs')

const randomName = ext => `./${Math.random()}.${ext}`

function wavToMp3(wavBuffer, config = { outSampleRate: 16000 }) {
	return new Promise((resolve) => {
		const tmpIn = randomName('wav')

		const reader = new wav.Reader()
		reader.on('format', (format) => {
			// console.log('WAV format: %j', format)
			const opt = Object.assign(format, config)
			const encoder = new lame.Encoder(opt)
			const tmpOut = randomName('mp3')
			const out = fs.createWriteStream(tmpOut)
			const res = () => {
				resolve(fs.readFileSync(tmpOut, null))
				fs.unlinkSync(tmpIn)
				fs.unlinkSync(tmpOut)
			}
			out.on('close', res)
			reader.pipe(encoder).pipe(out)
		})

		fs.writeFileSync(tmpIn, wavBuffer)
		fs.createReadStream(tmpIn).pipe(reader)
	})
}

function mp3ToWav(mp3Buffer) {
	return new Promise((resolve) => {
		const tmpIn = randomName('mp3')

		const decoder = new lame.Decoder()
		decoder.on('format', (format) => {
			// console.log('MP3 format: %j', format)
			const writer = new wav.Writer(format)
			const tmpOut = randomName('wav')
			const out = fs.createWriteStream(tmpOut)
			const res = () => {
				resolve(fs.readFileSync(tmpOut, null))
				fs.unlinkSync(tmpIn)
				fs.unlinkSync(tmpOut)
			}
			out.on('close', res)
			decoder.pipe(writer).pipe(out)
		})

		fs.writeFileSync(tmpIn, mp3Buffer)
		fs.createReadStream(tmpIn).pipe(decoder)
	})
}

async function mp3ToWavWith16kSampleRate(anySampleRateMp3buffer) {
	const wavBuffer = await mp3ToWav(anySampleRateMp3buffer)
	const mp3Buffer = await wavToMp3(wavBuffer, { outSampleRate: 16000 })
	const wav8kBuffer = await mp3ToWav(mp3Buffer)
	return wav8kBuffer
}

async function wavToWavWith16kSampleRate(anySampleRateWavbuffer) {
	const mp3Buffer = await wavToMp3(anySampleRateWavbuffer, { outSampleRate: 16000 })
	const wav8kBuffer = await mp3ToWav(mp3Buffer)
	return wav8kBuffer
}

module.exports = { mp3ToWavWith16kSampleRate, wavToWavWith16kSampleRate }
