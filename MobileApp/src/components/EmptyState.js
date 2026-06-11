import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function EmptyState({message='No data'}){
  return (
    <View style={styles.center}><Text style={{color:'#666'}}>{message}</Text></View>
  );
}

const styles = StyleSheet.create({center:{padding:20, alignItems:'center'}});
