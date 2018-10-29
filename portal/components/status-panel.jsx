import R from 'ramda'
import React from 'React'
import PropTypes from 'prop-types'
import { Row, Col, List, Icon, Select, Collapse } from 'antd'

const { webkitSpeechRecognition, speechSynthesis } = window

class StatusPanel extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			supportSpeechRecognition: !!webkitSpeechRecognition,
			supportSpeechSynthesis: !!speechSynthesis,
			voices: [],
			selectedVoice: null,
		}
		if (speechSynthesis) {
			speechSynthesis.onvoiceschanged = () => {
				const voices = speechSynthesis.getVoices()
				const selectedVoice = (R.find(R.propEq('default', true))(voices) || {}).name
				this.setState({ voices, selectedVoice })
			}
		}
		this.onChangeVoice = this.onChangeVoice.bind(this)
	}

	onChangeVoice(selectedVoice) {
		this.setState({ selectedVoice })
		if (this.props.onChangeVoice) {
			this.props.onChangeVoice(selectedVoice)
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
								<Col span={6}>语音朗读</Col>
								<Col span={18}><Icon {...iconProps(this.state.supportSpeechSynthesis)} /></Col>
							</Row>
						</List.Item>
						<List.Item>
							<Row {...rowProps}>
								<Col span={6}>语音朗读</Col>
								<Col span={18}>
									<Select style={{ width: '100%' }} value={this.state.selectedVoice} onChange={this.onChangeVoice}>
										{this.state.voices.map(voice => (
											<Select.Option value={voice.name} key={voice.name}>{voice.name}</Select.Option>
										))}
									</Select>
								</Col>
							</Row>
						</List.Item>
					</List>
				</Collapse.Panel>
			</Collapse>
		)
	}
}

StatusPanel.propTypes = {
	title: PropTypes.node,
	onChangeVoice: PropTypes.func,
}

export default { StatusPanel }
