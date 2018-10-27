/* global artifact, ... */
const {
  ACL,
  DAOFactory,
  EVMScriptRegistryFactory,
  Kernel,
} = require('@tpt/test-helpers/artifacts')

const Allocations = artifacts.require('Allocations')

const { assertRevert } = require('@tpt/test-helpers/assertThrow')
const timetravel = require('@tpt/test-helpers/timeTravel')(web3)

// TODO: Fix Vault not loading artifacts error
// const Vault = artifacts.require('@aragon/apps-vault/contracts/Vault')

// const createdPayoutId = receipt =>
//   receipt.logs.filter(x => x.event == 'StartPayout')[0].args.voteId // TODO: not-used

const ANY_ADDR = ' 0xffffffffffffffffffffffffffffffffffffffff'

contract('Allocations App', accounts => {
  let daoFact,
    app = {}

  const root = accounts[0]

  before(async () => {
    const kernelBase = await Kernel.new(true)
    const aclBase = await ACL.new()
    const regFact = await EVMScriptRegistryFactory.new()
    daoFact = await DAOFactory.new(
      kernelBase.address,
      aclBase.address,
      regFact.address
    )
  })

  beforeEach(async () => {
    console.log('00-before each')

    const r = await daoFact.newDAO(root)
    console.log('01-daoFact.newDao(root)')

    const dao = Kernel.at(
      r.logs.filter(l => l.event == 'DeployDAO')[0].args.dao
    )
    console.log('02-Kernel at')

    const acl = ACL.at(await dao.acl())
    console.log('03-ACL.at')

    await acl.createPermission(
      root,
      dao.address,
      await dao.APP_MANAGER_ROLE(),
      root,
      { from: root }
    )

    console.log('04-acl.createPermission')

    const address = (await Allocations.new()).address
    console.log('4.5', address)

    let receipt = await dao.newAppInstance('0x1234', address, 0x0, {
      from: root,
    })
    console.log('05-dao.newAppInstance')

    app = Allocations.at(
      receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy
    )

    console.log('06-Allocations.at')

    await acl.createPermission(
      ANY_ADDR,
      app.address,
      await app.START_PAYOUT_ROLE(),
      root,
      { from: root }
    )
    console.log('07-acl.createPermission, start_payout_role')

    await acl.createPermission(
      ANY_ADDR,
      app.address,
      await app.SET_DISTRIBUTION_ROLE(),
      root,
      { from: root }
    )
    console.log('08-acl.createPermission, set_distr')

    await acl.createPermission(
      ANY_ADDR,
      app.address,
      await app.EXECUTE_PAYOUT_ROLE(),
      root,
      { from: root }
    )
    console.log('09-acl.createPermission, execute_pa')

    // TODO: Fix vault
    // vault = Vault.at(
    //   receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy
    // )

    receipt = await dao.newAppInstance(
      '0x2345',
      (await Allocations.new()).address,
      { from: root }
    )
    console.log('10-dao.newAppinsta, receipt')

    allocation = Allocations.at(
      receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy
    )
    await app.initialize({ from: accounts[0] })
    console.log('11-Allocations.at')
  })

  context('app creation and funded Payout', () => {
    const empire = accounts[0]
    const bobafett = accounts[1]
    const dengar = accounts[2]
    const bossk = accounts[3]
    let imperialBudget

    let bobafettInitialBalance
    let dengarInitialBalance
    let bosskInitialBalance
    let allocationId
    let supports

    before(async () => {
      imperialBudget = await web3.eth.getBalance(empire)
      // var send = await web3.eth.sendTransaction({
      //   from: empire,
      //   to: app.address,
      //   value: web3.toWei(0.1, 'ether'),
      // })
      bobafettInitialBalance = await web3.eth.getBalance(bobafett)
      dengarInitialBalance = await web3.eth.getBalance(dengar)
      bosskInitialBalance = await web3.eth.getBalance(bossk)
      candidateAddresses = [bobafett, dengar, bossk]
    })

    beforeEach(async () => {
      allocationId = (await app.newPayout(
        'Fett\'s vett',
        web3.toWei(1, 'ether'),
        0x0
      )).logs[0].args.accountId.toNumber()

      supports = [500, 200, 300]
      totalsupport = 1000

      await app.fund(allocationId, {
        from: empire,
        value: web3.toWei(0.01, 'ether'),
      })

      await app.setDistribution(
        candidateAddresses,
        supports,
        allocationId,
        false,
        false,
        0,
        web3.toWei(0.01, 'ether')
      )
    })

    it('app initialized properly', async () => {
      let initBlock = await app.getInitializationBlock()
      assert.isAbove(
        initBlock.toNumber(),
        0,
        'App was not initialized properly'
      )
    })

    it('can create a new Payout', async () => {
      payoutMembers = await app.getPayout(allocationId)
      assert.equal(payoutMembers[2], 'Fett\'s vett', 'Payout metadata incorrect')
      assert.equal(
        payoutMembers[0].toNumber(),
        10000000000000000,
        'Payout Balance Incorrect'
      )
      assert.equal(
        payoutMembers[1].toNumber(),
        1000000000000000000,
        'Payout Limit incorrect'
      )
    })

    it('sets the distribution', async () => {
      const candidateArrayLength = (await app.getNumberOfCandidates(
        allocationId
      )).toNumber()
      let storedSupport = []
      let supportVal

      for (let i = 0; i < candidateArrayLength; i++) {
        supportVal = (await app.getPayoutDistributionValue(
          allocationId,
          i
        )).toNumber()
        assert.equal(
          supports[i],
          supportVal,
          'support distributions do not match what is specified'
        )
        storedSupport.push(supportVal)
      }
      assert.equal(
        supports.length,
        storedSupport.length,
        'distribution array lengths do not match'
      )
    })

    it('executes the payout', async () => {
      await app.runPayout(allocationId, { from: empire })
      const bobafettBalance = await web3.eth.getBalance(bobafett)
      const dengarBalance = await web3.eth.getBalance(dengar)
      const bosskBalance = await web3.eth.getBalance(bossk)
      assert.equal(
        bobafettBalance.toNumber() - bobafettInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[0]) / totalsupport,
        'bounty hunter expense'
      )
      assert.equal(
        dengarBalance.toNumber() - dengarInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[1]) / totalsupport,
        'bounty hunter expense'
      )
      assert.equal(
        bosskBalance.toNumber() - bosskInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[2]) / totalsupport,
        'bounty hunter expense'
      )
    })

    it('cannot add to balance without passing equal msg.value', async () => {
      allocationId = (await app.newPayout(
        'Fett\'s Lambo',
        web3.toWei(1, 'ether'),
        0x0
      )).logs[0].args.accountId.toNumber()

      supports = [300, 300, 400]
      totalsupport = 1000

      return assertRevert(async () => {
        await app.setDistribution(
          candidateAddresses,
          supports,
          allocationId,
          false,
          false,
          0,
          web3.toWei(0.01, 'ether'),
          { from: empire }
        )
      })
    })
  })

  context('Informational Payout', () => {
    const empire = accounts[0]
    const bobafett = accounts[1]
    const dengar = accounts[2]
    const bossk = accounts[3]
    let imperialBudget

    let bobafettInitialBalance
    let dengarInitialBalance
    let bosskInitialBalance
    let allocationId
    let supports

    before(async () => {
      imperialBudget = await web3.eth.getBalance(empire)
      var send = await web3.eth.sendTransaction({
        from: empire,
        to: app.address,
        value: web3.toWei(0.01, 'ether'),
      })
      bobafettInitialBalance = await web3.eth.getBalance(bobafett)
      dengarInitialBalance = await web3.eth.getBalance(dengar)
      bosskInitialBalance = await web3.eth.getBalance(bossk)
      candidateAddresses = [bobafett, dengar, bossk]
    })

    beforeEach(async () => {
      allocationId = (await app.newPayout(
        'Fett\'s auto warranty',
        0,
        0x0
      )).logs[0].args.accountId.toNumber()

      supports = [300, 400, 300]
      totalsupport = 1000
      await app.setDistribution(
        candidateAddresses,
        supports,
        allocationId,
        true,
        false,
        0,
        0,
        { from: empire }
      )
    })

    it('can create new Payout', async () => {
      payoutMembers = await app.getPayout(allocationId)
      assert.equal(
        payoutMembers[2],
        'Fett\'s auto warranty',
        'Payout metadata incorrect'
      )
      assert.equal(payoutMembers[0].toNumber(), 0, 'Payout Balance Incorrect')
      assert.equal(payoutMembers[1].toNumber(), 0, 'Payout Limit incorrect')
    })

    it('sets the distribution', async () => {
      const candidateArrayLength = (await app.getNumberOfCandidates(
        allocationId
      )).toNumber()
      let storedSupport = []
      let supportVal

      for (let i = 0; i < candidateArrayLength; i++) {
        supportVal = (await app.getPayoutDistributionValue(
          allocationId,
          i
        )).toNumber()
        assert.equal(
          supports[i],
          supportVal,
          'support distributions do not match what is specified'
        )
        storedSupport.push(supportVal)
      }
      assert.equal(
        supports.length,
        storedSupport.length,
        'distribution array lengths do not match'
      )
    })
    it('cannot accept funds', async () => {
      //assertrevert when attempt to add funds
      supports = [300, 400, 300]
      totalsupport = 1000
      return assertRevert(async () => {
        await app.setDistribution(
          candidateAddresses,
          supports,
          allocationId,
          true,
          false,
          0,
          0,
          { from: empire, value: web3.toWei(0.01, 'ether') }
        )
      })
    })
    it('cannot execute', async () => {
      // assertrevert an attempt to run runPayout for an informational vote
      return assertRevert(async () => {
        await app.runPayout(allocationId)
      })
    })
  })

  context('Recurring Payout', () => {
    const empire = accounts[0]
    const bobafett = accounts[1]
    const dengar = accounts[2]
    const bossk = accounts[3]
    let imperialBudget

    let bobafettInitialBalance
    let dengarInitialBalance
    let bosskInitialBalance
    let allocationId
    let supports

    before(async () => {
      imperialBudget = await web3.eth.getBalance(empire)
      var send = await web3.eth.sendTransaction({
        from: empire,
        to: app.address,
        value: web3.toWei(0.01, 'ether'),
      })
      bobafettInitialBalance = await web3.eth.getBalance(bobafett)
      dengarInitialBalance = await web3.eth.getBalance(dengar)
      bosskInitialBalance = await web3.eth.getBalance(bossk)
      candidateAddresses = [bobafett, dengar, bossk]
    })

    beforeEach(async () => {
      allocationId = (await app.newPayout(
        'Fett\'s auto warranty',
        web3.toWei(0.1, 'ether'),
        0x0
      )).logs[0].args.accountId.toNumber()
    })
    it('cannot occur more frequently than daily', async () => {
      supports = [300, 400, 300]
      totalsupport = 1000
      return assertRevert(async () => {
        await app.setDistribution(
          candidateAddresses,
          supports,
          allocationId,
          false,
          true,
          86300,
          web3.toWei(0.01, 'ether'),
          { from: empire, value: web3.toWei(0.01, 'ether') }
        )
      })
    })

    it('will not execute more frequently than the specified period', async () => {
      supports = [300, 400, 300]
      totalsupport = 1000
      await app.fund(allocationId, {
        from: empire,
        value: web3.toWei(0.01, 'ether'),
      })
      await app.setDistribution(
        candidateAddresses,
        supports,
        allocationId,
        false,
        true,
        86400,
        web3.toWei(0.01, 'ether')
      )
      timetravel(86500)
      await app.runPayout(allocationId)
      const bobafettBalance = await web3.eth.getBalance(bobafett)
      const dengarBalance = await web3.eth.getBalance(dengar)
      const bosskBalance = await web3.eth.getBalance(bossk)
      assert.equal(
        bobafettBalance.toNumber() - bobafettInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[0]) / totalsupport,
        'bounty hunter expense 1 not paid out'
      )
      assert.equal(
        dengarBalance.toNumber() - dengarInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[1]) / totalsupport,
        'bounty hunter expense 2 not paid out'
      )
      assert.equal(
        bosskBalance.toNumber() - bosskInitialBalance.toNumber(),
        (web3.toWei(0.01, 'ether') * supports[2]) / totalsupport,
        'bounty hunter expense 3 not paid out'
      )

      await app.fund(allocationId, {
        from: empire,
        value: web3.toWei(0.01, 'ether'),
      })
      timetravel(43200)
      return assertRevert(async () => {
        await app.runPayout(allocationId)
      })
    })
  })
})
