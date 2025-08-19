import { Card } from "@/components/Cards";
import NoResults from "@/components/NoResults";
import icons from "@/constants/icons";
import { getUserProperties } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import NotificationIcon from "@/components/NotificationIcon";

export default function MyPropertiesScreen() {
  const { userProfile } = useGlobalContext();
  const userId = userProfile?.$id;
  const [loading, setLoading] = useState(true);
  const [myProperties, setMyProperties] = useState<any[]>([]);

  const fetchUserProperties = async () => {
    try {
      setLoading(true);
      const props = await getUserProperties(userId!);
      setMyProperties(props);
    } catch (error) {
      console.error("Error fetching your properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchUserProperties();
  }, [userId]);

  const handleCardPress = (id: string) => {
    router.push(`/properties/${id}`);
  };

  return (
    <SafeAreaView className="bg-white flex-1" edges={["left", "right", "bottom"]}>
      <FlatList
        data={myProperties}
        renderItem={({ item }) => {
          if (!userId) return null;
          return (
            <Card item={item} userId={userId} onPress={() => handleCardPress(item.$id)} />
          );
        }}
        keyExtractor={(item) => item.$id}
        numColumns={2}
        contentContainerClassName="pb-32"
        columnWrapperClassName="flex gap-5 px-5"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" className="text-primary-300 mt-5" />
          ) : (
            <NoResults />
          )
        }
        ListHeaderComponent={
          <View className="px-5">
            <View className="flex flex-row items-center justify-between mt-5 px-1">
              <TouchableOpacity
                onPress={() => router.push("/(root)/(tabs)/profile")}
                className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center"
              >
                <Image source={icons.backArrow} className="size-5" />
              </TouchableOpacity>
              <Text className="text-base mr-2 text-center font-rubik-medium text-black-300">
                Your Properties
              </Text>
              <NotificationIcon/>
            </View>
            <Text className="text-xl font-rubik-bold text-black-300 mt-5">
              {myProperties.length} Properties
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
