import {StatusBar, StyleSheet, View} from 'react-native';
import {CounterView} from '../components/CounterView';
import {CounterButton} from '../components/CounterButton';
import React from 'react';

const mainScreenStyles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    backgroundColor: 'lightgray',
  },

  incrementButtonContainer: {position: 'absolute', right: '5%', bottom: '3%'},
  counterContainer: {
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function MainScreen() {
  return (
    <View style={mainScreenStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="darkblue" />
      <View
        style={{
          ...mainScreenStyles.container,
          ...mainScreenStyles.counterContainer,
        }}>
        <CounterView />
      </View>
      <View style={mainScreenStyles.incrementButtonContainer}>
        <CounterButton />
      </View>
    </View>
  );
}