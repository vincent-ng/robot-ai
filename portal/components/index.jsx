// import R from 'ramda'
import React from 'react'
import ReactDOM from 'react-dom'
import { Row, Col, Button, Input, Icon, List, Avatar } from 'antd'
import { talkToAI } from './ai'
import { speakRecognition, speak } from './speak'
import './index.css'

class App extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			loadingSpeakRecognition: false,
			loadingSend: false,
			inputHistory: [],
			inputHistoryIndex: null,
			input: '',
			chatList: [{ text: '在输入框输入文字，或点击录音按钮可与我对话。', isMe: false }],
			sr: null,
		}
		this.onSpeakRecognition = this.onSpeakRecognition.bind(this)
		this.onStopSpeakRecognition = this.onStopSpeakRecognition.bind(this)
		this.onSend = this.onSend.bind(this)
	}

	componentDidMount() {
		this.speakInput.focus()
	}

	componentDidUpdate() {
		this.messagesEnd.scrollIntoView({ behavior: 'instant', block: 'end' })
	}

	async onSpeakRecognition() {
		this.setState({ loadingSpeakRecognition: true })
		let input = '对不起，我没听清楚你说什么'
		try {
			const sr = speakRecognition()
			this.setState({ sr })
			input = await sr.listern()
		} catch (e) {
			input = e.message
		}
		this.setState({ input, sr: null, loadingSpeakRecognition: false })
		await this.onSend(input)
	}

	async onStopSpeakRecognition() {
		this.state.sr.stop()
		this.setState({ sr: null, loadingSpeakRecognition: false })
	}

	async onSend(defaultAnswer = '') {
		const text = this.state.input
		if (text) {
			this.state.chatList.push({ text, isMe: true })
			this.state.inputHistory.push(text)
		}
		this.setState({ input: '', inputHistoryIndex: null })

		this.setState({ loadingSend: true })
		const answer = await talkToAI(text, { emptySpeak: defaultAnswer, emptyAnswer: '智商掉线了' })
		this.state.chatList.push({ text: answer, isMe: false })
		this.setState({ loadingSend: false })
		speak(answer)
		this.speakInput.focus()
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

	render() {
		const avatarCol = {
			style: { textAlign: 'right' },
			sm: { span: 2 },
			md: { span: 1 },
		}
		const chatCol = {
			sm: { span: 22 },
			md: { span: 23 },
		}

		return (
			<div style={{ margin: 50 }}>
				<h1>Robot AI</h1>
				<hr />
				<div className="chat-box">
					<List
						dataSource={this.state.chatList}
						split={false}
						renderItem={item => (
							<List.Item>
								{item.isMe &&
									<Row style={{ width: '100%', transform: 'scaleX(-1)' }}>
										<Col {...avatarCol}>
											<Avatar icon="user" size="large" />
										</Col>
										<Col {...chatCol}>
											<div className="chat-box-item is-me">{item.text}</div>
										</Col>
									</Row>
								}
								{!item.isMe &&
									<Row style={{ width: '100%' }}>
										<Col {...avatarCol}>
											<Avatar icon="robot" size="large" />
										</Col>
										<Col {...chatCol}>
											<div className="chat-box-item">{item.text}</div>
										</Col>
									</Row>
								}
							</List.Item>
						)}
					/>
					<div style={{ float: 'left', clear: 'both' }} ref={(el) => { this.messagesEnd = el }} />
				</div>
				<Row gutter={{ xs: 0, sm: 20, md: 20 }}>
					<Col span={20}>
						<Input
							onChange={e => this.setState({ input: e.target.value })}
							value={this.state.input} onPressEnter={this.onSend}
							onKeyDown={e => this.onKeyDown(e.key)}
							disabled={this.state.loadingSpeakRecognition || this.state.loadingSend}
							ref={(el) => { this.speakInput = el }}
						/>
					</Col>
					<Col span={this.state.input ? 4 : 0}>
						<Button style={{ width: '100%' }} onClick={this.onSend} loading={this.state.loadingSend}>Send</Button>
					</Col>
					<Col span={!this.state.input && !this.state.loadingSpeakRecognition ? 4 : 0}>
						<Button style={{ width: '100%' }} onClick={this.onSpeakRecognition}><Icon type="sound" theme="outlined" /></Button>
					</Col>
					<Col span={!this.state.input && this.state.loadingSpeakRecognition ? 4 : 0}>
						<Button style={{ width: '100%' }} onClick={this.onStopSpeakRecognition}><Icon type="pause" theme="outlined" /></Button>
					</Col>
				</Row>
			</div>
		)
	}
}

ReactDOM.render(<App />, document.getElementById('root'))
