import { app } from './'

export async function onRewardAdded({ rewards = [] }, { rewardId }) {
  console.log('rewardId ', rewardId)
  if (!rewards[rewardId]) {
    rewards[rewardId] = await getRewardById(rewardId)
    console.log('rewards: ', rewards)
  }

  return { rewards }
}

/////////////////////////////////////////
/*      rewards helper functions       */
/////////////////////////////////////////

const getRewardById = async rewardId => {
  return await app.call('getReward', rewardId)
    .first()
    .map(data => ({
      rewardId,
      isMerit: data.isMerit,
      referenceToken: data.referenceToken,
      rewardToken: data.rewardToken,
      amount: data.amount,
      endBlock: data.EndBlock,
      delay: data.delay,
    }))
    .toPromise()
}