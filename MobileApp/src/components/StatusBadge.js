import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function StatusBadge({online}){
  return (
    <View style={[styles.badge, {backgroundColor: online ? '#1abc9c' : '#e74c3c'}]}>
      <Text style={styles.text}>{online ? 'Online' : 'Offline'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge:{paddingHorizontal:8, paddingVertical:4, borderRadius:12},
  text:{color:'#fff', fontSize:12}
});
