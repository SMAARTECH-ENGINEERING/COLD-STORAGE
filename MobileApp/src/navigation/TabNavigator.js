import React from "react";
import {
  View,
  Text,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import DashboardScreen from "../screens/DashboardScreen";
import DeviceListScreen from "../screens/DeviceListScreen";
import AlertsListScreen from "../screens/AlertListScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

function CustomHeader({ title, navigation }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brandText}>Cold Storage</Text>
        <Text style={styles.screenTitle}>{title}</Text>
      </View>

      <Pressable
        onPress={() => navigation.navigate("Profile")}
        style={styles.profileButton}
      >
        <Ionicons
          name="person-circle-outline"
          size={34}
          color="#FFFFFF"
        />
      </Pressable>
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        header: () => (
          <CustomHeader
            title={route.name}
            navigation={navigation}
          />
        ),

        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#94A3B8",

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: Platform.OS === "ios" ? 0 : 4,
        },

        tabBarItemStyle: {
          paddingVertical: 4,
          borderRadius: 14,
        },

        tabBarStyle: {
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 12,
          height: Platform.OS === "ios" ? 78 : 70,

          backgroundColor: "#FFFFFF",
          borderRadius: 24,
          borderTopWidth: 0,

          elevation: 12,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },

        tabBarIcon: ({ focused, color }) => {
          let iconName;

          switch (route.name) {
            case "Dashboard":
              iconName = focused ? "grid" : "grid-outline";
              break;

            case "Devices":
              iconName = focused
                ? "hardware-chip"
                : "hardware-chip-outline";
              break;

            case "Alerts":
              iconName = focused
                ? "notifications"
                : "notifications-outline";
              break;

            case "Profile":
              iconName = focused
                ? "person"
                : "person-outline";
              break;

            default:
              iconName = "ellipse-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={focused ? 26 : 22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: "Home" }}
      />

      <Tab.Screen
        name="Devices"
        component={DeviceListScreen}
      />

      <Tab.Screen
        name="Alerts"
        component={AlertsListScreen}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Platform.OS === "ios" ? 125 : 110,
    backgroundColor: "#2563EB",

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",

    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: Platform.OS === "ios" ? 50 : 20,

    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,

    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },

  brandText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontStyle: "italic",
    fontFamily: Platform.OS === "ios" ? "Snell Roundhand" : "cursive",
  },

  screenTitle: {
    color: "#E2E8F0",
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },

  profileButton: {
    paddingBottom: 4,
  },
});