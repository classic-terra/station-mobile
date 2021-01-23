import React, { ReactElement, ReactNode, useState } from 'react'
import {
  View,
  StyleProp,
  ViewStyle,
  ScrollView,
  RefreshControl,
} from 'react-native'
import color from 'styles/color'

export type BodyProps = {
  theme?: 'white' | 'sky' | 'sapphire'
  containerStyle?: StyleProp<ViewStyle>
  children: ReactNode
  scrollable?: boolean
  onRefresh?: () => Promise<void>
}

const Body = (props: BodyProps): ReactElement => {
  const { theme, onRefresh } = props
  const [refreshing, setRefreshing] = useState(false)
  const _onRefresh = (): void => {
    if (onRefresh) {
      setRefreshing(true)
      onRefresh().then((): void => {
        setRefreshing(false)
      })
    }
  }

  const containerStyle: StyleProp<ViewStyle> = {
    paddingHorizontal: 20,
  }

  switch (theme) {
    case 'sapphire':
      containerStyle.backgroundColor = color.sapphire
      break
    case 'sky':
      containerStyle.backgroundColor = color.sky
      break
    case 'white':
    default:
      containerStyle.backgroundColor = color.white
      break
  }

  return (
    <>
      {props.scrollable ? (
        <ScrollView
          refreshControl={
            onRefresh && (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={_onRefresh}
              />
            )
          }
          contentContainerStyle={[
            containerStyle,
            props.containerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {props.children}
        </ScrollView>
      ) : (
        <View
          style={[containerStyle, { flex: 1 }, props.containerStyle]}
        >
          {props.children}
        </View>
      )}
    </>
  )
}

export default Body
