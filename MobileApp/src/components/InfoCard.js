import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function InfoCard({title, children}){
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={{marginTop:8}}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{padding:12, backgroundColor:'#fff', borderRadius:8},
  title:{fontWeight:'600'}
});
