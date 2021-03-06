import { observe, SidePanel, Main, ToastHub } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { map } from 'rxjs/operators'

import { Accounts, NewAccountButton } from '.'
import { Title } from '../Shared'
import { NewAccount, NewAllocation } from '../Panel'
import { ETH_DECIMALS } from '../../utils/constants'
import { networkContextType } from '../../../../../shared/ui'
// import { allocationsMockData } from '../../utils/mockData'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    accounts: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    network: {},
  }

  static childContextTypes = {
    network: networkContextType,
  }

  state = {
    accounts: [],
    panel: {
      visible: false,
    },
    // TODO: Don't use this in production
    // ...allocationsMockData,
  }

  getChildContext() {
    const { network } = this.props
    return {
      network: {
        type: network.type,
      },
    }
  }

  createAccount = ({ limit, ...account }) => {
    account.balance = 0
    account.limit = ETH_DECIMALS.times(limit).toString()
    this.props.app.newPayout(account.description, account.limit, 0x0)
    this.closePanel()
    console.info('App.js: Account Created:')
    console.table(account)
    this.setState({})
  }

  submitAllocation = allocation => {
    const emptyIntArray = new Array(allocation.addresses.length).fill(0)
    this.props.app.setDistribution(
      allocation.addresses,
      emptyIntArray, //[]
      emptyIntArray, //[]
      '',
      allocation.description,
      emptyIntArray, // Issue with bytes32 handling
      emptyIntArray, // Issue with bytes32 handling
      allocation.payoutId,
      allocation.informational,
      allocation.recurring,
      allocation.period,
      allocation.balance
    )
    console.info('App.js: Allocation submitted:')
    console.table(allocation)
    this.closePanel()
  }

  onExecutePayout = id => {
    console.info('App.js: Executing Payout:')
    console.info(id)
    this.props.app.executePayout(id)
  }

  manageParameters = address => {
    // TODO: Implement
    console.info(
      `'App.js: Manage Parameters clicked from account with address: ${address}`
    )
  }

  newAccount = () => {
    this.setState({
      panel: {
        visible: true,
        content: NewAccount,
        data: { heading: 'New Account', onCreateAccount: this.createAccount },
      },
    })
  }

  newAllocation = (address, description, id, limit) => {
    // The whole entries vs entities thing needs to be fixed; these are too close
    //const userEntity = {addr: '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb', data: {entryAddress: '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb', name: 'Bob', entryType: 'user'}}
    const promptEntity = {
      addr: 0x0,
      data: { entryAddress: 0x0, name: 'Select an entry', entryType: 'prompt' },
    }
    const entriesList = [promptEntity].concat(this.props.entries)
    let entities = this.props.entries !== undefined ? entriesList : []
    this.setState({
      panel: {
        visible: true,
        content: NewAllocation,
        data: {
          address,
          id,
          limit,
          heading: 'New Allocation',
          subHeading: description,
          onSubmitAllocation: this.submitAllocation,
          entities: entities,
        },
      },
    })
  }

  closePanel = () => {
    this.setState({ panel: { visible: false } })
  }

  render() {
    const { panel } = this.state
    const PanelContent = panel.content
    return (
      // TODO: Profile App with React.StrictMode, perf and why-did-you-update, apply memoization
      <StyledAragonApp>
        <ToastHub>
          <Title text="Allocations" />
          <NewAccountButton onClick={this.newAccount} />
          <Accounts
            accounts={
              //TODO: Change back to this.props.accounts when done
              this.props.accounts !== undefined ? this.props.accounts : []
            }
            onNewAccount={this.newAccount}
            onNewAllocation={this.newAllocation}
            onManageParameters={this.manageParameters}
            onExecutePayout={this.onExecutePayout}
            app={this.props.app}
          />
          <SidePanel
            title={(panel.data && panel.data.heading) || ''}
            opened={panel.visible}
            onClose={this.closePanel}
          >
            {panel.content && <PanelContent {...panel.data} />}
          </SidePanel>
        </ToastHub>
      </StyledAragonApp>
    )
  }
}

const StyledAragonApp = styled(Main)`
  display: flex;
  height: 100vh;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
`

export default observe(
  observable => observable.pipe(map(state => ({ ...state }))),
  {}
)(App)
