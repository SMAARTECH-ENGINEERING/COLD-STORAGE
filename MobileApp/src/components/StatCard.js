import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function StatCard({label, value}){
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{padding:12, backgroundColor:'#fff', borderRadius:8, alignItems:'center', margin:6, minWidth:80},
  value:{fontSize:18, fontWeight:'700'},
  label:{color:'#666', marginTop:4, fontSize:12}
});
