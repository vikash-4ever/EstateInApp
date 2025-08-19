import icons from "@/constants/icons";
import images from "@/constants/images";
import { config, login } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { account, databases } from "@/lib/appwrite";
const databaseId = config.databaseId!;
const userProfilesCollectionId = config.userProfilesCollectionId!;
import { Redirect } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ID, Permission, Query, Role } from "react-native-appwrite";

const SignIn = () => {
  const { refetch, loading, isLoggedIn } = useGlobalContext();
  const [loginLoading, setLoginLoading] = useState(false);

  // Show overlay until login & global state are ready
  if (loading || loginLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000000" />
        <Text className="mt-3 text-black font-rubik-medium">
          Signing in...
        </Text>
      </SafeAreaView>
    );
  }

  if (isLoggedIn) return <Redirect href="/" />;

  const isValidUrl = (url: string) => {
    return /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(url);
  };

  const syncUserProfile = async () => {
    const userAccount = await account.get();

    const avatarUrl =
      typeof userAccount.prefs?.avatar === "string" && isValidUrl(userAccount.prefs.avatar)
        ? userAccount.prefs.avatar
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(userAccount.name)}&background=random`;

    const existingUser = await databases.listDocuments(
      databaseId,
      userProfilesCollectionId,
      [Query.equal("userId", userAccount.$id)]
    );

    if (existingUser.total === 0) {
      await databases.createDocument(
        databaseId,
        userProfilesCollectionId,
        ID.unique(),
        {
          userId: userAccount.$id,
          name: userAccount.name,
          email: userAccount.email,
          avatar: avatarUrl,
        },
        [
          Permission.read(Role.user(userAccount.$id)),
          Permission.update(Role.user(userAccount.$id)),
          Permission.delete(Role.user(userAccount.$id)),
        ]
      );
      console.log("User profile created.");
    } else {
      console.log("User profile already exists.");
    }
  };

  const handleLogin = async () => {
    try {
      setLoginLoading(true);

      console.log("Logging in...");
      const result = await login();

      if (result) {
        console.log("Login successful, syncing user...");
        await syncUserProfile();
        console.log("User synced, updating global state...");
        await refetch();
      } else {
        Alert.alert("Error", "Failed to log in.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Error", "Login failed or profile sync error.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerClassName="h-full">
        <Image
          source={images.onboarding}
          className="w-full h-[60%]"
          resizeMode="cover"
        />
        <View className="px-10 mt-8">
          <Text className="text-base text-lg text-center uppercase font-rubik text-black-200">
            Welcome to EstateIn
          </Text>
          <Text className="text-2xl font-rubik-bold text-black-300 text-center mt-2">
            Let's Get You Closer to {"\n"}
            <Text className="text-primary-300">Your Ideal Home</Text>
          </Text>
          <Text className="text-lg font-rubik text-black-200 text-center mt-12">
            Login to EstateIn with Google
          </Text>

          <TouchableOpacity
            onPress={handleLogin}
            className="bg-white shadow-md shadow-zinc-300 rounded-full w-full py-4 mt-5"
          >
            <View className="flex flex-row items-center justify-center">
              <Image
                source={icons.google}
                className="w-5 h-5"
                resizeMode="contain"
              />
              <Text className="text-lg font-rubik-medium text-black-300 ml-2">
                Continue with Google
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
