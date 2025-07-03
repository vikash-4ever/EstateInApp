import icons from "@/constants/icons";
import images from "@/constants/images";
import { config, login } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { account, databases } from "@/lib/appwrite";
const databaseId = config.databaseId!;
const userProfilesCollectionId = config.userProfilesCollectionId!;
import { Redirect } from "expo-router";
import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ID, Permission, Query, Role } from "react-native-appwrite";

const SignIn = () => {
  const { refetch, loading, isLoggedIn } = useGlobalContext();
  if (!loading && isLoggedIn) return <Redirect href="/" />;

  const isValidUrl = (url: string) => {
    return /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/.test(url);
  };

  const syncUserProfile = async () => {
    try {
      const userAccount = await account.get();

      const avatarUrl = typeof userAccount.prefs?.avatar === "string" && isValidUrl(userAccount.prefs.avatar)
      ? userAccount.prefs.avatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(userAccount.name)}&background=random`;

      // Check if the user already has a profile by custom userId field
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
    } catch (error) {
      throw error; // rethrow for login error handling
    }
  };

  const handleLogin = async () => {
    try {
      console.log("Logging in...");
      const result = await login();

      if (result) {
        console.log("Login successful, syncing user...");
        await syncUserProfile();
        console.log("User synced, updating global state...");
        refetch();
      } else {
        Alert.alert("Error", "Failed to log in.");
      }
    } catch (error: any) {
      console.error("Sync error :", error);
      if (
        error?.message?.includes("Attribute") ||
        error?.message?.includes("invalid format")
      ) {
        Alert.alert("Login Successful", "But profile sync failed: Invalid avatar format.");
      } else if (
        error?.message?.includes("scope (account)") ||
        error?.type === "AppwriteException"
      ) {
        Alert.alert(
          "Login Successful",
          "But sync failed: Not authorized to create a profile. Check permissions."
        );
      } else {
        Alert.alert("Login Successful", "But failed to sync profile.");
      }
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <ScrollView contentContainerClassName="h-full">
        <Image
          source={images.onboarding}
          className="w-full h-4/6"
          resizeMode="contain"
        />
        <View className="px-10">
          <Text className="text-base text-center uppercase font-rubik text-black-200">
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
              <Text className="text-lg font-rubik-mudium text-black-300 ml-2">
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
