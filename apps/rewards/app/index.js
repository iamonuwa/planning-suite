import React from 'react'
import ReactDOM from 'react-dom'
import Aragon, { providers } from '@aragon/api'
import App from './components/App/App'

class ConnectedApp extends React.Component {
  state = {
    app: new Aragon(new providers.WindowMessage(window.parent)),
    observable: null,
    userAccount: '',
    network: {},
    // ...allocationsMockData
  }
  componentDidMount() {
    window.addEventListener('message', this.handleWrapperMessage)
  }
  componentWillUnmount() {
    window.removeEventListener('message', this.handleWrapperMessage)
  }
  // handshake between Aragon Core and the iframe,
  // since iframes can lose messages that were sent before they were ready
  handleWrapperMessage = ({ data }) => {
    if (data.from !== 'wrapper') {
      return
    }
    if (data.name === 'ready') {
      const { app } = this.state
      this.sendMessageToWrapper('ready', true)
      this.setState({
        observable: app.state(),
      })
      app.accounts().subscribe(accounts => {
        this.setState({
          userAccount: accounts[0],
        })
      })
      app.network().subscribe(network => {
        this.setState({ network })
      })
    }
  }
  sendMessageToWrapper = (name, value) => {
    window.parent.postMessage({ from: 'app', name, value }, '*')
  }
  render() {
    return <App {...this.state} />
  }
}
ReactDOM.render(<ConnectedApp />, document.getElementById('rewards'))
