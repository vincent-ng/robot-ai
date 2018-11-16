import React from 'React'
import PropTypes from 'prop-types'

require('github-fork-ribbon-css/gh-fork-ribbon.css')

const DefaultTitle = 'Fork me on GitHub'

class ForkMeOnGithub extends React.Component {
	static get propTypes() {
		return {
			href: PropTypes.string,
			title: PropTypes.string,
			position: PropTypes.string,
		}
	}

	constructor(props) {
		super(props)
		this.className = ['github-fork-ribbon']
		this.className.push(this.props.position || 'left-top')
	}


	render() {
		return (
			<a className={this.className.join(' ')} href={this.props.href} title={this.props.title || DefaultTitle}>{this.props.title || DefaultTitle}</a>
		)
	}
}

export default { ForkMeOnGithub }
