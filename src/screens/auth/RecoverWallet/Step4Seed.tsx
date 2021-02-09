import React, { useState, ReactElement, useEffect } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useRecoilValue } from 'recoil'
import {
  CommonActions,
  NavigationProp,
  useNavigation,
} from '@react-navigation/native'
import { useBank } from 'use-station/src'
import { MnemonicKey } from '@terra-money/terra.js'
import _ from 'lodash'

import Body from 'components/layout/Body'
import { navigationHeaderOptions } from 'components/layout/Header'
import SubHeader from 'components/layout/SubHeader'
import Button from 'components/Button'
import NumberStep from 'components/NumberStep'
import Badge from 'components/Badge'
import { Text } from 'components'

import RecoverWalletStore from 'stores/RecoverWalletStore'
import { useBioAuth } from 'hooks/useBioAuth'
import { isSupportedBiometricAuthentication } from 'utils/bio'
import {
  recoverWalletWithMnemonicKey,
  generateAddresses,
} from 'utils/wallet'
import color from 'styles/color'
import { getIsUseBioAuth } from 'utils/storage'
import { RecoverWalletStackParams } from 'types'

const AddressBox = ({
  bip,
  mk,
  selectedMk,
  setSelectedMk,
}: {
  bip: 118 | 330
  mk: MnemonicKey
  selectedMk?: MnemonicKey
  setSelectedMk: React.Dispatch<
    React.SetStateAction<MnemonicKey | undefined>
  >
}): ReactElement => {
  const bank = useBank({ address: mk.accAddress })
  const [isVested, setIsVested] = useState(false)
  const [isDelegated, setIsDelegated] = useState(false)
  const [isUndelegated, setIsUndelegated] = useState(false)
  const [balanceList, setBalanceList] = useState<string[]>([])
  const [showAddressBox, setShowAddressBox] = useState(false)
  const selectedStyle =
    selectedMk &&
    (selectedMk === mk
      ? { borderColor: color.sapphire, opacity: 0.9 }
      : { opacity: 0.5 })

  useEffect(() => {
    if (bank.data) {
      const { data } = bank
      setIsVested(_.some(data.vesting))
      setIsDelegated(_.some(data.delegations))
      setIsUndelegated(_.some(data.unbondings))
      if (_.some(data.balance)) {
        setBalanceList(
          data.balance.map(
            ({ available, denom }) => `${available} ${denom}`
          )
        )
      }
      setShowAddressBox(
        bip === 330 ||
          _.some(data.balance) ||
          _.some(data.vesting) ||
          _.some(data.delegations) ||
          _.some(data.unbondings)
      )
    }
  }, [bank.loading])

  return showAddressBox ? (
    <TouchableOpacity
      onPress={(): void => {
        setSelectedMk(mk)
      }}
    >
      <View style={[styles.addressBox, selectedStyle]}>
        <View style={styles.addressBadgeBox}>
          <Badge text={`BIP ${bip}`} />
          {isVested && <Badge text={'Vested'} />}
          {isDelegated && <Badge text={'Delegated'} />}
          {isUndelegated && <Badge text={'Undelegated'} />}
        </View>
        <View style={styles.addressBoxAddress}>
          <Text>{mk.accAddress}</Text>
        </View>
        <View>
          {_.map(balanceList, (balance, i) => (
            <Text key={`balanceList-${i}`}>{balance}</Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  ) : (
    <View />
  )
}

const Screen = (): ReactElement => {
  const { dispatch } = useNavigation<
    NavigationProp<RecoverWalletStackParams>
  >()
  const seed = useRecoilValue(RecoverWalletStore.seed)
  const name = useRecoilValue(RecoverWalletStore.name)
  const password = useRecoilValue(RecoverWalletStore.password)

  const [mk118, setMk118] = useState<MnemonicKey>()
  const [mk330, setMk330] = useState<MnemonicKey>()
  const [selectedMk, setSelectedMk] = useState<MnemonicKey>()

  const { openIsUseBioAuth } = useBioAuth()

  const onPressNext = async (): Promise<void> => {
    const result =
      selectedMk &&
      (await recoverWalletWithMnemonicKey(selectedMk, {
        name,
        password,
      }))

    if (result?.success) {
      if (
        false === (await getIsUseBioAuth()) &&
        (await isSupportedBiometricAuthentication())
      ) {
        openIsUseBioAuth()
      }

      dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            {
              name: 'WalletRecovered',
              params: { wallet: result.wallet },
            },
          ],
        })
      )
    }
  }

  const stepConfirmed = _.some(selectedMk)

  useEffect(() => {
    const { mk118, mk330 } = generateAddresses(seed.join(' '))
    setMk118(mk118)
    setMk330(mk330)
  }, [])

  return (
    <>
      <SubHeader
        theme={'sapphire'}
        title={'Select Address to Recover'}
      />
      <Body
        theme={'sky'}
        containerStyle={styles.container}
        scrollable
      >
        <View style={{ flex: 1 }}>
          {mk118 && (
            <View style={{ marginBottom: 20 }}>
              <AddressBox
                mk={mk118}
                bip={118}
                {...{ setSelectedMk, selectedMk }}
              />
            </View>
          )}
          {mk330 ? (
            <AddressBox
              mk={mk330}
              bip={330}
              {...{ setSelectedMk, selectedMk }}
            />
          ) : (
            <Text>Loading...</Text>
          )}
        </View>

        <Button
          title="Recover"
          theme={'sapphire'}
          containerStyle={{ marginTop: 40 }}
          disabled={!stepConfirmed}
          onPress={onPressNext}
        />
      </Body>
    </>
  )
}

const HeaderRight = (): ReactElement => (
  <NumberStep stepSize={3} nowStep={3} />
)

Screen.navigationOptions = navigationHeaderOptions({
  theme: 'sapphire',
  headerRight: HeaderRight,
})

export default Screen

const styles = StyleSheet.create({
  container: {
    paddingBottom: 50,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  addressBox: {
    padding: 20,
    borderWidth: 2,
    borderRadius: 5,
    borderColor: '#d2d9f0',
  },
  addressBoxAddress: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9edf8',
    marginBottom: 20,
  },
  addressBadgeBox: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
})
