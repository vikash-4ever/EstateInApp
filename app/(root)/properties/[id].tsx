import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
  ActivityIndicator,
  BackHandler,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import FullScreenImageViewer from "@/components/FullScreenImageViewer";
import icons from "@/constants/icons";
import images from "@/constants/images";
import Comment from "@/components/Comment";
import { facilities } from "@/constants/data";
import { useAppwrite } from "@/lib/useAppwrite";
import {
  addToFavorites,
  deleteProperty,
  getFavorites,
  getOrCreateChat,
  getPropertyById,
  removeFromFavorites,
  sendBookingRequest,
} from "@/lib/appwrite";
import { useEffect, useState } from "react";
import { useGlobalContext } from "@/lib/global-provider";
import MapView, { Marker } from "react-native-maps";

const Property = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const windowHeight = Dimensions.get("window").height;
  const {userProfile : uId} = useGlobalContext();
  const { data: property, loading } = useAppwrite({
    fn: getPropertyById,
    params: { id: id! },
  });

  const details = property?.details ? JSON.parse(property.details) : {};
  const meta = property?.meta ? JSON.parse(property.meta) : {};
  const facilities = meta?.facilities || [];

  const screenWidth = Dimensions.get("window").width;
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const { user } = useGlobalContext();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleImageScroll = (event: any) => {
    const slide = Math.ceil(
      event.nativeEvent.contentOffset.x / screenWidth
    );
    if (slide !== activeImageIndex) {
      setActiveImageIndex(slide);
    }
  };

  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageViewer(true);
  };

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !property?.$id) return;

      const favorites = await getFavorites(user.$id);
      const favorite = favorites.find((fav) => fav.propertyId === property.$id);

      if (favorite) {
        setIsFavorite(true);
        setFavoriteId(favorite.$id);
      }
    };

    checkFavorite();
  }, [user, property?.$id]);

  useEffect(() => {
    const backAction = () => {
      if (showImageViewer) {
        setShowImageViewer(false);
        return true;
      }
      return false;
    };
  
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [showImageViewer]);

  const facilityImages: Record<string, any> = {
    "WiFi": require('@/assets/icons/wifi.png'),
    "Parking": require('@/assets/icons/car-park.png'),
    "Food": require('@/assets/icons/food.png'),
    "Gym": require('@/assets/icons/dumbell.png'),
    "Pet-Friendly": require('@/assets/icons/dog.png'),
  };

  const handleFavoritePress = async () => {
    if (!user || !property?.$id) return;

    try {
      if (isFavorite && favoriteId) {
        await removeFromFavorites(favoriteId);
        setIsFavorite(false);
        setFavoriteId(null);
      } else {
        const newFav = await addToFavorites(user.$id, property.$id);
        setIsFavorite(true);
        setFavoriteId(newFav.$id);
      }
    } catch (error) {
      console.error("Error handling favorite toggle:", error);
    }
  };

  const handleBookingRequest = async () => {
    if (!property || !uId) return;
    try {
      await sendBookingRequest({
        propertyId: property.$id,
        senderProfileId: uId!.$id,
        receiverProfileId: property.userProfile.$id,
      });
      Alert.alert("Booking request sent!");
    } catch (error) {
      Alert.alert("Failed to send request.");
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this property?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteProperty(property!.$id);
              router.back();
            } catch (error) {
              console.error("Error deleting post:", error);
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const handleChatPress = async () => {
    if (!user?.$id || !property?.userProfile?.userId) return;

    try {
      const chat = await getOrCreateChat(user.$id, property.userProfile.userId);

      router.push({
        pathname: "/(root)/chats/[id]",
        params: {
          id: chat.$id,
          userId: property.userProfile.userId,
        },
      });
    } catch (error) {
      console.error("Failed to initiate chat:", error);
    }
  };
  
  const handleOwnerPress = () => {
    if (property?.userProfile?.$id) {
      router.push(`/users/${property.userProfile.$id}`);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 bg-white"
      >
        <View className="relative w-full" style={{ height: windowHeight / 2 }}>
          <FlatList
            data={property?.images && property.images.length > 0 ? property.images : [images.japan]}
            horizontal
            pagingEnabled
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item}-${index}`}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(
                e.nativeEvent.contentOffset.x / Dimensions.get("window").width
              );
              setSelectedImageIndex(newIndex);
            }}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => handleImagePress(index)}>
                <Image
                  source={{ uri: item }}
                  className="w-[100vw] h-[50vh]"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          />
          <View className="absolute bottom-4 w-full flex-row justify-center items-center z-50">
            {(property?.images || [images.japan]).map((_: string, index: number) => (
              <View
                key={index}
                className={`h-2 w-2 mx-1 rounded-full ${
                  index === activeImageIndex ? "bg-primary-300" : "bg-gray-300"
                }`}
              />
            ))}
          </View>

          <View
            className="z-50 absolute inset-x-7"
            style={{ top: Platform.OS === "ios" ? 70 : 20 }}
          >
            <View className="flex flex-row items-center w-full justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-primary-200 rounded-full size-11 items-center justify-center"
              >
                <Image source={icons.backArrow} className="size-5" />
              </TouchableOpacity>

              <View className="flex flex-row items-center gap-3">
                <TouchableOpacity onPress={handleFavoritePress}>
                  <Image
                    source={isFavorite ? icons.heartfilled : icons.blackheart}
                    className="size-7"
                  />
                </TouchableOpacity>

                {property?.userProfile?.$id === uId?.$id ? (
                  <TouchableOpacity onPress={handleDeletePost}>
                    <Image source={icons.trash} className="size-7" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handleChatPress}>
                    <Image source={icons.send} className="size-7" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        <View className="px-5 mt-7 gap-2">
          <Text className="text-2xl font-rubik-extrabold">{property?.name}</Text>

          <View className="flex-row items-center gap-3">
            <View className="px-4 py-2 bg-primary-100 rounded-full">
              <Text className="text-xs font-rubik-bold text-primary-300">
                {meta?.type}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Image source={icons.star} className="size-5" />
              <Text className="text-black-200 text-sm mt-1 font-rubik-medium">
                {property?.rating} ({property?.reviews?.length || 0} reviews)
              </Text>
            </View>
          </View>

          {/* Property Specs */}
          <View className="flex-row items-center mt-5">
            <View className="bg-primary-100 rounded-full size-10 items-center justify-center">
              <Image source={icons.bed} className="size-4" tintColor={'#dfb6b2'}/>
            </View>
            <Text className="text-black-300 text-sm font-rubik-medium ml-2">
              {details?.bedrooms} Beds
            </Text>

            <View className="bg-primary-100 rounded-full size-10 ml-7 items-center justify-center">
              <Image source={icons.bath} className="size-4" tintColor={'#dfb6b2'}/>
            </View>
            <Text className="text-black-300 text-sm font-rubik-medium ml-2">
              {details?.bathrooms} Baths
            </Text>

            <View className="bg-primary-100 rounded-full size-10 ml-7 items-center justify-center">
              <Image source={icons.area} className="size-4" tintColor={'#dfb6b2'}/>
            </View>
            <Text className="text-black-300 text-sm font-rubik-medium ml-2">
              {details?.area} sqft
            </Text>
          </View>

          {/* Facilities */}
          {facilities.length > 0 && (
            <View className="mt-5">
              <Text className="text-black-300 text-xl font-rubik-bold mb-2">Facilities</Text>
              <View className="flex-row flex-wrap gap-2">
                {facilities.map((facility: string, index: number) => (
                  <View key={index} className="flex-row items-center px-3 py-2 bg-primary-100 rounded-full gap-2">
                    <Image
                      source={facilityImages[facility]}
                      className="w-4 h-4"
                      resizeMode="contain"
                      tintColor={'#dfb6b2'}
                    />
                    <Text className="text-sm text-black-300 font-rubik-medium">
                      {facility}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Owner Info */}
          <View className="border-t border-primary-200 pt-7 mt-5">
            <Text className="text-black-300 text-xl font-rubik-bold">Owner</Text>

            <View className="flex-row items-center justify-between mt-4">
              <TouchableOpacity
                onPress={handleOwnerPress}
                className="flex-row items-center"
              >
                <Image
                  source={{ uri: property?.userProfile?.avatar }}
                  className="size-14 rounded-full"
                />
              </TouchableOpacity>

              <View className="flex-1 mx-3">
                <TouchableOpacity onPress={handleOwnerPress}>
                  <Text className="text-lg text-black-300 font-rubik-bold">
                    {property?.userProfile?.name}
                  </Text>
                </TouchableOpacity>
                <Text 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                  className="text-sm text-black-200 font-rubik-medium">
                  {property?.userProfile?.email}
                </Text>
              </View>

              <View className="flex-row gap-3">
                <Image source={icons.chat} className="size-7" tintColor="#dfb6b2" />
                <Image source={icons.phone} className="size-7" tintColor="#dfb6b2" />
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold">Overview</Text>
            <Text className="text-black-200 text-base font-rubik mt-2">
              {property?.description}
            </Text>
          </View>

          {/* Location */}
          <View className="mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold">Location</Text>

            <Text className="text-black-200 text-sm font-rubik-medium mt-4">
              {property?.address}
            </Text>

            {property?.meta && (
              <View
                className="w-full mt-5 h-52 rounded-xl overflow-hidden"
              >
                <MapView
                  style={{ flex: 1 }}
                  region={{
                    latitude: JSON.parse(property.meta).geolocation.lat,
                    longitude: JSON.parse(property.meta).geolocation.lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                  zoomEnabled
                  scrollEnabled
                  pitchEnabled={false}
                  rotateEnabled={true}
                >
                  <Marker
                    coordinate={{
                      latitude: JSON.parse(property.meta).geolocation.lat,
                      longitude: JSON.parse(property.meta).geolocation.lng,
                    }}
                  />
                </MapView>
              </View>
            )}
          </View>


          {/* Reviews */}
          {property?.reviews?.length > 0 && (
            <View className="mt-7">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Image source={icons.star} className="size-6" />
                  <Text className="text-black-300 text-xl font-rubik-bold ml-2">
                    {property!.rating} ({property!.reviews.length} reviews)
                  </Text>
                </View>

                <TouchableOpacity>
                  <Text className="text-primary-300 text-base font-rubik-bold">
                    View All
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mt-5">
                <Comment item={property!.reviews[0]} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <FullScreenImageViewer
        visible={showImageViewer}
        images={(property?.images || [images.japan]).map((img: string) => ({
          url: img,
        }))}
        currentIndex={selectedImageIndex}
        onClose={() => setShowImageViewer(false)}
        swipeToCloseEnabled
        doubleTapToZoomEnabled
      />

      {/* Footer */}
      <View className="absolute bg-white bottom-0 w-full rounded-t-2xl border-t border-primary-200 p-7 py-3">
        <View className="flex-row items-center justify-between gap-10">
          <View>
            <Text className="text-black-200 text-xs font-rubik-medium">Price</Text>
            <Text
              numberOfLines={1}
              className="text-primary-300 text-2xl font-rubik-bold"
            >
              ₹{property?.price}
            </Text>
          </View>

          <TouchableOpacity onPress={handleBookingRequest} className="flex-1 bg-primary-300 py-3 rounded-full items-center justify-center shadow-md shadow-zinc-400">
            <Text className="text-white text-lg font-rubik-bold">Request for Booking</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>

  );
};

export default Property;
