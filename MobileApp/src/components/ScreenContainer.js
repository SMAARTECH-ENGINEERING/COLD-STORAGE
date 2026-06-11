import React from 'react';
import {StyleSheet, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

export default function ScreenContainer({children, scroll, style, contentStyle}) {
  if (scroll) {
    return (
      <SafeAreaView style={[styles.root, style]} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={[styles.content, contentStyle]}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, style]} edges={['top', 'bottom', 'left', 'right']}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2f5f7',
    // paddingTop: 16,
  },
  content: {
    flexGrow: 1,
    padding: 12,
    // paddingTop: 20,
  },
});
