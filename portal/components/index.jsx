// import R from 'ramda'
import React from 'react'
import ReactDOM from 'react-dom'
import { Row, Col, Button, Input, Avatar, Divider } from 'antd'
import { StatusPanel } from './status-panel'
import { talkToAI } from './ai'
import { speechRecord, speak } from './speak'
import { ForkMeOnGithub } from './fork-me-on-github'
import './index.css'

class App extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			loadingSpeech: false,
			loadingSend: false,
			inputMode: 'sound',
			inputHistory: [],
			inputHistoryIndex: null,
			input: '',
			chatList: [{ text: '在输入框输入文字，或点击录音按钮可与我对话。', isMe: false }],
			voice: null,
			sr: null,
			speechRecordFormat: undefined,
		}
		this.onSpeech = this.onSpeech.bind(this)
		this.onStopSpeech = this.onStopSpeech.bind(this)
	}

	componentDidMount() {
		this.speechInput.focus()
	}

	componentDidUpdate() {
		this.messagesEnd.scrollIntoView({ behavior: 'instant', block: 'end' })
	}

	async onSpeech() {
		this.setState({ loadingSpeech: true })
		let defaultAnswer
		try {
			const sr = speechRecord(this.state.speechRecordFormat)
			this.setState({ sr })
			const input = await sr.listern()
			this.setState({ input, sr })
		} catch (e) {
			defaultAnswer = e.message
		}
		this.setState({ loadingSpeech: false })
		await this.onSend(defaultAnswer)
	}

	async onStopSpeech() {
		this.state.sr.stop()
		this.setState({ sr: null, loadingSpeech: false })
	}

	async onSend(defaultAnswer = '对不起，我没听清楚你说什么') {
		const text = this.state.input
		const isAudio = text instanceof Blob
		if (text) {
			if (isAudio) {
				this.addChat({ text: '', url: URL.createObjectURL(text), isMe: true, isAudio })
			} else {
				this.addChat({ text, isMe: true })
			}
		}

		this.setState({ loadingSend: true })
		const { input, output } = await talkToAI(text, { emptyInput: defaultAnswer, emptyOutput: '智商掉线了' })
		if (isAudio && input) {
			this.addChat({ text: input, isMe: true })
		}
		this.addChat({ text: output, isMe: false })
		this.setState({ loadingSend: false })
		speak(output, this.state.voice)
		this.speechInput.focus()
	}

	async onKeyDown(key) {
		if (this.state.inputHistory.length === 0) {
			return
		}
		if (key === 'ArrowUp') {
			let inputHistoryIndex = this.state.inputHistoryIndex === null ? this.state.inputHistory.length - 1 : this.state.inputHistoryIndex - 1
			inputHistoryIndex = inputHistoryIndex < 0 ? 0 : inputHistoryIndex
			const input = this.state.inputHistory[inputHistoryIndex]
			this.setState({ input, inputHistoryIndex })
		} else if (key === 'ArrowDown') {
			if (this.state.inputHistoryIndex === null) {
				return
			}
			let inputHistoryIndex = this.state.inputHistoryIndex + 1
			inputHistoryIndex = inputHistoryIndex >= this.state.inputHistory.length ? this.state.inputHistory.length : inputHistoryIndex
			const input = this.state.inputHistory[inputHistoryIndex] || ''
			this.setState({ input, inputHistoryIndex })
		}
	}

	addChat(content) {
		this.state.chatList.push(content)
		if (content.isMe && !content.isAudio) {
			this.state.inputHistory.push(content.text)
		}
		this.setState({ input: '', inputHistoryIndex: null })
	}

	render() {
		const avatarCol = {
			style: { textAlign: 'right' },
			xs: { span: 3 },
			sm: { span: 2 },
			md: { span: 1 },
		}
		const chatCol = {
			xs: { span: 21 },
			sm: { span: 22 },
			md: { span: 23 },
		}

		return (
			<div>
				<ForkMeOnGithub position="top-right" href="https://github.com/vincent-ng/robot-ai" title="Fork" />
				<StatusPanel
					title={<b style={{ fontSize: 16 }}>Robot AI v0.0.5</b>}
					onChangeVoice={voice => this.setState({ voice })}
					onChangeSpeechRecordFormat={speechRecordFormat => this.setState({ speechRecordFormat })}
				/>
				<Divider />
				<div className="chat-box">
					{this.state.chatList.map((item, i) => (
						<Row style={{ transform: item.isMe ? 'scaleX(-1)' : '', margin: '20px 0' }} key={i}>
							<Col {...avatarCol}>
								<Avatar icon="user" size="large" />
							</Col>
							<Col {...chatCol}>
								{!item.isAudio && <div className={item.isMe ? 'chat-box-item is-me' : 'chat-box-item'}>{item.text}</div>}
								{item.isAudio && <audio controls className={item.isMe ? 'chat-box-item is-me' : 'chat-box-item'} src={item.url} />}
							</Col>
						</Row>
					))}
					<div style={{ float: 'left', clear: 'both' }} ref={(el) => { this.messagesEnd = el }} />
				</div>
				<Row>
					<Col span={this.state.inputMode === 'text' ? 2 : 0} style={{ textAlign: 'center' }}>
						<Button shape="circle" icon="sound" onClick={() => this.setState({ inputMode: 'sound' })} />
					</Col>
					<Col span={this.state.inputMode === 'text' ? 22 : 0}>
						<Input
							onChange={e => this.setState({ input: e.target.value })}
							value={this.state.input} onPressEnter={() => this.onSend()}
							onKeyDown={e => this.onKeyDown(e.key)}
							disabled={this.state.loadingSpeech || this.state.loadingSend}
							ref={(el) => { this.speechInput = el }}
						/>
					</Col>

					<Col span={this.state.inputMode === 'sound' ? 2 : 0} style={{ textAlign: 'center' }}>
						<Button shape="circle" icon="align-left" onClick={() => this.setState({ inputMode: 'text' })} />
					</Col>
					<Col span={this.state.inputMode === 'sound' && !this.state.loadingSpeech ? 22 : 0}>
						<Button onClick={this.onSpeech} style={{ width: '100%' }}>点击 说话</Button>
					</Col>
					<Col span={this.state.inputMode === 'sound' && this.state.loadingSpeech ? 22 : 0}>
						<Button onClick={this.onStopSpeech} style={{ width: '100%' }}>点击 结束</Button>
					</Col>
				</Row>
			</div>
		)
	}
}

ReactDOM.render(<App />, document.getElementById('root'))
