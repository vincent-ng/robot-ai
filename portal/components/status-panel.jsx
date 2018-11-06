import R from 'ramda'
import React from 'React'
import PropTypes from 'prop-types'
import { Row, Col, List, Icon, Select, Collapse } from 'antd'
import { speechRecordToMp3, speechRecordToWav } from './speak'

const { webkitSpeechRecognition, speechSynthesis } = window

class StatusPanel extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			supportSpeechRecognition: !!webkitSpeechRecognition,
			supportSpeechSynthesis: !!speechSynthesis,
			supportSpeechRecord: [],
			selectedSpeechRecordFormat: null,
			voices: [],
			selectedVoice: null,
			errors: [],
		}
		if (speechSynthesis) {
			speechSynthesis.onvoiceschanged = () => {
				const voices = speechSynthesis.getVoices()
				const selectedVoice = (R.find(R.propEq('default', true))(voices) || {}).name
				this.setState({ voices, selectedVoice })
			}
		}
		this.onChangeVoice = this.onChangeVoice.bind(this)
		this.onChangeSpeechRecordFormat = this.onChangeSpeechRecordFormat.bind(this)
	}

	componentDidMount() {
		this.checkFeatures()
	}

	onChangeVoice(selectedVoice) {
		this.setState({ selectedVoice })
		if (this.props.onChangeVoice) {
			this.props.onChangeVoice(selectedVoice)
		}
	}

	onChangeSpeechRecordFormat(selectedSpeechRecordFormat) {
		this.setState({ selectedSpeechRecordFormat })
		if (this.props.onChangeSpeechRecordFormat) {
			this.props.onChangeSpeechRecordFormat(selectedSpeechRecordFormat)
		}
	}

	async checkFeatures() {
		const handleErr = (e) => {
			console.log(e.message || e.name || e)
			this.setState(({ errors }) => {
				errors.push(e)
				return { errors }
			})
		}

		const selectFirst = () => this.onChangeSpeechRecordFormat(this.state.supportSpeechRecord[0].format)

		if (this.state.supportSpeechRecognition) {
			this.state.supportSpeechRecord.push({ format: 'txt', desc: '本地语音识别，推荐使用' })
			selectFirst()
		}

		try {
			await speechRecordToWav(1).listern()
			this.setState(({ supportSpeechRecord }) => {
				supportSpeechRecord.push({ format: 'wav', desc: 'WAV，传输体积大，格式转换运算快' })
				return { supportSpeechRecord }
			}, selectFirst)
		} catch (e) {
			handleErr(e)
		}

		try {
			await speechRecordToMp3(1).listern()
			this.setState(({ supportSpeechRecord }) => {
				supportSpeechRecord.push({ format: 'mp3', desc: 'MP3，传输体积小，格式转换运算慢' })
				return { supportSpeechRecord }
			}, selectFirst)
		} catch (e) {
			handleErr(e)
		}
	}

	render() {
		const iconProps = flag => ({
			style: { color: flag ? 'lightgreen' : 'orangered' },
			type: flag ? 'check-circle' : 'close-circle',
		})
		const rowProps = {
			style: { width: '100%' },
			gutter: 16,
		}
		return (
			<Collapse bordered={false}>
				<Collapse.Panel style={{ border: 0 }} header={this.props.title}>
					<List bordered>
						<List.Item>
							<Row {...rowProps}>
								<Col span={6}>语音识别</Col>
								<Col span={18}><Icon {...iconProps(this.state.supportSpeechRecognition)} /></Col>
							</Row>
						</List.Item>
						<List.Item>
							<Row {...rowProps}>
								<Col span={6}>语音录入</Col>
								<Col span={18}><Icon {...iconProps(this.state.supportSpeechRecord.length)} /></Col>
							</Row>
						</List.Item>
						{!!this.state.supportSpeechRecord.length &&
							<List.Item>
								<Row {...rowProps}>
									<Col span={6}>录入格式</Col>
									<Col span={18}>
										<Select style={{ width: '100%' }} value={this.state.selectedSpeechRecordFormat} onChange={this.onChangeSpeechRecordFormat}>
											{this.state.supportSpeechRecord.map(item => (
												<Select.Option value={item.format} key={item.format}>{item.desc}</Select.Option>
											))}
										</Select>
									</Col>
								</Row>
							</List.Item>
						}
						<List.Item>
							<Row {...rowProps}>
								<Col span={6}>语音合成</Col>
								<Col span={18}><Icon {...iconProps(this.state.supportSpeechSynthesis)} /></Col>
							</Row>
						</List.Item>
						{!!this.state.voices.length &&
							<List.Item>
								<Row {...rowProps}>
									<Col span={6}>合成声音</Col>
									<Col span={18}>
										<Select style={{ width: '100%' }} value={this.state.selectedVoice} onChange={this.onChangeVoice}>
											{this.state.voices.map(voice => (
												<Select.Option value={voice.name} key={voice.name}>{voice.name}</Select.Option>
											))}
										</Select>
									</Col>
								</Row>
							</List.Item>
						}
					</List>
				</Collapse.Panel>
				{!!this.state.errors.length &&
					<Collapse.Panel style={{ border: 0 }} header="error">
						{this.state.errors.map((e, i) => <div key={i}>{e.message || e.name}: {JSON.stringify(e)}</div>)}
					</Collapse.Panel>
				}
			</Collapse>
		)
	}
}

StatusPanel.propTypes = {
	title: PropTypes.node,
	onChangeVoice: PropTypes.func,
	onChangeSpeechRecordFormat: PropTypes.func,
}

export default { StatusPanel }
