import React from 'react'
import styled from 'styled-components'
import icon from '../../assets/account-card.svg'
import PropTypes from 'prop-types'

import {
  Card,
  Text,
  ContextMenu,
  ContextMenuItem,
  IconAdd,
  IconSettings,
  SafeLink,
  theme,
} from '@aragon/ui'

// import provideNetwork from '../../utils/provideNetwork'


const Account = ({
  id,
  proxy,
  balance,
  description,
  limit,
  onNewAllocation,
  onManageParameters,
  token,
}) => {
  

  const newAllocation = () => {
    onNewAllocation(proxy, description, id, limit)
  }

  const manageParameters = () => {
    onManageParameters(proxy)
  }
  /*Need a better solution that this, should be handled in
  App.js using token manager once more tokens are supported */
  function translateToken(token) {
    if(token == 0x0){
      return 'ETH'
    }
  }

  const truncatedProxy = `${proxy.slice(0, 6)}...${proxy.slice(-4)}`
  const translatedToken = translateToken(token)
 // const { network: { etherscanBaseUrl } } = this.props


  return (
    <StyledCard>
      <MenuContainer>
        <ContextMenu>
          <ContextMenuItem onClick={newAllocation}>
            <IconAdd />
            <ActionLabel>New Allocation</ActionLabel>
          </ContextMenuItem>
          <ContextMenuItem onClick={manageParameters}>
            <IconSettings />
            <ActionLabel>Manage Parameters</ActionLabel>
          </ContextMenuItem>
        </ContextMenu> 
      </MenuContainer>
      <IconContainer />
      <CardTitle>{description}</CardTitle>
      <CardAddress>
          <SafeLink
            href={`https://rinkeby.etherscan.io/address/${proxy}`}
            target="_blank">
            {truncatedProxy}
          </SafeLink>
      </CardAddress>
      <StatsContainer>
        <StatsTitle>Balance</StatsTitle>
        <StatsValue>
          {balance} {translatedToken}
        </StatsValue>
      </StatsContainer>
      <StatsContainer>
        <StatsTitle>Limit</StatsTitle>
        <StatsValue>
          {limit} {translatedToken}/ Allocation
        </StatsValue>
      </StatsContainer>
    </StyledCard>
  )
}

Account.propTypes = {
  proxy: PropTypes.string.isRequired,
  limit: PropTypes.number.isRequired,
  token: PropTypes.string.isRequired,
  balance: PropTypes.number.isRequired,
  description: PropTypes.string.isRequired,
  onNewAllocation: PropTypes.func.isRequired,
  onManageParameters: PropTypes.func.isRequired,
}

const StyledCard = styled(Card)`
  height: 300px;
  width: 300px;
`

const MenuContainer = styled.div`
  float: right;
  margin-top: 1rem;
  margin-right: 1rem;
`

const ActionLabel = styled.span`
  margin-left: 15px;
`

const CardTitle = styled(Text.Block).attrs({
  size: 'large',
})`
  text-align: center;
  font-weight: bold;
  font-size: 20px;
  color: ${theme.textPrimary};
`

const CardAddress = styled(Text.Block).attrs({
  size: 'small',
})`
  text-align: center;
  width: 300px;
  color: ${theme.accent};
`

const IconContainer = styled.img.attrs({
  size: 'large',
  src: icon,
})`
  alt: ${({ description }) => description} 'icon';
  margin-top: 4rem;
  margin-left: 110px;
`

const StatsContainer = styled.div`
  width: 50%;
  display: inline-block;
  margin-top: 3rem;
  padding-left: 1rem;
`

const StatsTitle = styled.p`
  color: #6d777b;
  font-size: 16px;
  text-transform: lowercase;
  font-variant: small-caps;
`

const StatsValue = styled.p`
  font-size: 14px;
`

export default Account