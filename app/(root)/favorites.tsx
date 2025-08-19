import { Card } from "@/components/Cards";
import NoResults from "@/components/NoResults";
import icons from "@/constants/icons";
import { getFavoriteProperties, getFavorites, getProperties } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { useCallback, useEffect, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import NotificationIcon from "@/components/NotificationIcon";

export default function FavoritesScreen() {
  const { user, favoritesUpdated } = useGlobalContext();
  const userId = user?.$id;
  const [loading, setLoading] = useState(true);
  const [favoriteProperties, setFavoriteProperties] = useState<any[]>([]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const favProps = await getFavoriteProperties(user!.$id);
      setFavoriteProperties(favProps);
    } catch (error) {
      console.error("Error loading favorite properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.$id) {
        fetchFavorites();
      }
    }, [user, favoritesUpdated])
  );

  const handleCardPress = (id: string) => {
    router.push(`/properties/${id}`);
  };

  return (
    <SafeAreaView className="bg-white flex-1" edges={["left", "right", "bottom"]}>
      <FlatList
        data={favoriteProperties}
        renderItem={({ item }) => (
          <Card item={item} userId={userId!} onPress={() => handleCardPress(item.$id)} />
        )}
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
                onPress={() => router.push('/(root)/(tabs)/profile')}
                className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center"
              >
                <Image source={icons.backArrow} className="size-5" />
              </TouchableOpacity>
              <Text className="text-base mr-2 text-center font-rubik-medium text-black-300">
                Your Favorite Homes
              </Text>
              <NotificationIcon/>
            </View>
            <Text className="text-xl font-rubik-bold text-black-300 mt-5">
              {favoriteProperties.length} Favorites
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
