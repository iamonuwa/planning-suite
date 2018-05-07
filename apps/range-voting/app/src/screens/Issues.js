import React from 'react'
import styled from 'styled-components'
import { EmptyStateCard } from '@aragon/ui'
import emptyIcon from '../assets/empty-card-icon.svg'
const EmptyIcon = () => <img src={emptyIcon} alt="" />

const Content = ({ onActivate }) => (
  <Main>
    <EmptyStateCard
      icon={EmptyIcon}
      title="Issues"
      text="GitHub integration"
      actionText="New Project"
      onActivate={onActivate}
    />
  </Main>
)

const Main = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`

class Issues extends React.Component {
  render () {
    return (<Content />)
  }
}

export default Issues

