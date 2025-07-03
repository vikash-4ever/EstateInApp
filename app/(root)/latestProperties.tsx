import { Card } from "@/components/Cards";
import NoResults from "@/components/NoResults";
import icons from "@/constants/icons";
import { getProperties } from "@/lib/appwrite";
import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useGlobalContext } from "@/lib/global-provider";

export default function LatestPropertiesScreen() {
  const { user } = useGlobalContext();
  const userId = user?.$id;
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1); // Pagination state
  const [hasNextPage, setHasNextPage] = useState<boolean>(true); // Check if there's a next page

  const fetchProperties = async (page: number) => {
    try {
      setLoading(true);
      
      const batchSize = 6;
      const offset = (page - 1) * batchSize;
      const result = await getProperties({
        filter: "",
        query: "",
        limit: batchSize,
        offset,
      });

      setProperties(result);
      setHasNextPage(result.length === batchSize); // If the fetched batch is full, there might be another page
    } catch (error) {
      console.error("Error loading properties:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(page);
  }, [page]);

  const handleNextPage = () => {
    if (hasNextPage) {
      setPage((prev) => prev + 1); // Go to the next page
    }
  };

  const handlePropertyPress = (id: string) => {
    router.push(`/properties/${id}`);
  };

  return (
    <SafeAreaView className="bg-white flex-1">
      <FlatList
        data={properties}
        renderItem={({ item }) => {
          return (
            <Card
              item={item}
              userId={userId!}
              onPress={() => handlePropertyPress(item.$id)}
            />
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
            <View className="flex flex-row items-center justify-between mt-5">
            <TouchableOpacity
                onPress={() => {
                    if (page > 1) {
                    setPage(prev => prev - 1);
                    } else {
                    router.push('/');
                    }
                }}
                className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center"
            >
                <Image source={icons.backArrow} className="size-5" />
            </TouchableOpacity>
              <Text className="text-base mr-2 text-center font-rubik-medium text-black-300">
                Latest Properties
              </Text>
              <TouchableOpacity>
                <Image source={icons.bell} className="w-6 h-6" />
              </TouchableOpacity>
            </View>
          </View>
        }
        ListFooterComponent={
            hasNextPage && !loading ? (
              <TouchableOpacity
                onPress={handleNextPage}
                className="mt-5 bg-primary-300 py-2 rounded-lg mx-5"
              >
                <Text className="text-center text-white font-rubik-semibold">See more Properties</Text>
              </TouchableOpacity>
            ) : null
          }
      />
    </SafeAreaView>
  );
}
