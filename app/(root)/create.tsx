import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import MapView, { MapPressEvent, Marker } from "react-native-maps";
import * as Location from "expo-location";

import { createPost, getCurrentUserProfile } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { uploadImage } from "@/lib/uploadImage";
import { Feather } from '@expo/vector-icons';

const propertyTypes = ["House", "Apartment", "Shop", "Hall", "Room", "Plot"];
const propertyModes = ["Rent", "Sell"];
const facilityOptions = ["Parking", "WiFi", "Food", "Pet-Friendly", "Gym"];

const Create = () => {
  const { user } = useGlobalContext();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");

  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");

  const [type, setType] = useState(propertyTypes[0]);
  const [mode, setMode] = useState(propertyModes[0]);
  const [facilities, setFacilities] = useState<string[]>([]);

  const [images, setImages] = useState<string[]>([]);

  const [location, setLocation] = useState({ latitude: 20.5937, longitude: 78.9629 });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
        return;
      }

      const current = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    })();
  }, []);

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      selectionLimit: 15,
    });

    if (!result.canceled) {
      const uris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...uris]);
    }
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
  };

  const handleCreate = async () => {
    if (!name || !description || !address || !price || images.length === 0) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);

      const profileDoc = await getCurrentUserProfile();
      if (!profileDoc) {
        Alert.alert("Error", "User profile not found. Please complete your profile first.");
        return;
      }

      const uploadedImages = await Promise.all(images.map(uri => uploadImage(uri)));

      const details = JSON.stringify({
        area,
        bedrooms,
        bathrooms,
      });

      const meta = JSON.stringify({
        type,
        facilities,
        geolocation: {
          lat: location.latitude,
          lng: location.longitude,
        },
        mode,
      });

      await createPost({
        name,
        description,
        address,
        price: parseInt(price),
        rating: 0,
        images: uploadedImages,
        details,
        meta,
        userProfile: profileDoc.$id,
      });

      Alert.alert("Success", "Post created successfully!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="px-4 py-6">
        <Text className="text-2xl font-bold mb-4">Create Property Post</Text>

        <Text className="mb-2 font-medium text-base">Property Name</Text>
        <TextInput
          placeholder="Property Name"
          className="border p-3 rounded mb-4"
          value={name}
          onChangeText={setName}
        />

        <Text className="mb-2 font-medium text-base">Description</Text>
        <TextInput
          placeholder="Description"
          className="border p-3 rounded mb-4"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text className="mb-2 font-medium text-base">Address</Text>
        <TextInput
          placeholder="Address"
          className="border p-3 rounded mb-4"
          value={address}
          onChangeText={setAddress}
        />

        <Text className="mb-2 font-medium text-base">Price</Text>
        <TextInput
          placeholder="Price"
          className="border p-3 rounded mb-4"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <View className="flex-row justify-between">
          <View className="flex-1 mr-1">
            <Text className="mb-2 font-medium text-base">Area (sqft)</Text>
            <TextInput
              placeholder="Area"
              className="border p-3 rounded mb-4"
              value={area}
              onChangeText={setArea}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1 mx-1">
            <Text className="mb-2 font-medium text-base">Bedrooms</Text>
            <TextInput
              placeholder="Bedrooms"
              className="border p-3 rounded mb-4"
              value={bedrooms}
              onChangeText={setBedrooms}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1 ml-1">
            <Text className="mb-2 font-medium text-base">Bathrooms</Text>
            <TextInput
              placeholder="Bathrooms"
              className="border p-3 rounded mb-4"
              value={bathrooms}
              onChangeText={setBathrooms}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text className="mb-2 font-medium text-base">Property Type</Text>
        <View className="border rounded mb-4">
          <Picker selectedValue={type} onValueChange={setType}>
            {propertyTypes.map(item => (
              <Picker.Item label={item} value={item} key={item} />
            ))}
          </Picker>
        </View>

        <Text className="mb-2 font-medium text-base">Mode</Text>
        <View className="border rounded mb-4">
          <Picker selectedValue={mode} onValueChange={setMode}>
            {propertyModes.map(item => (
              <Picker.Item label={item} value={item} key={item} />
            ))}
          </Picker>
        </View>

        <Text className="mb-2 font-medium text-base">Facilities</Text>
        <View className="flex flex-wrap flex-row mb-4 gap-2">
          {facilityOptions.map(item => {
            const selected = facilities.includes(item);
            return (
              <TouchableOpacity
                key={item}
                onPress={() =>
                  setFacilities(prev =>
                    selected ? prev.filter(f => f !== item) : [...prev, item]
                  )
                }
                className={`px-3 py-2 rounded-full ${
                  selected ? "bg-black" : "bg-gray-200"
                }`}
              >
                <Text
                  className={`${
                    selected ? "text-white" : "text-black"
                  } font-medium text-sm`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="mb-2 font-medium text-base">Select Property Location</Text>
        <View className="h-64 w-full rounded-xl overflow-hidden mb-6">
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              ...location,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onPress={handleMapPress}
          >
            <Marker coordinate={location} />
          </MapView>
        </View>

        <Text className="mb-2 font-medium text-base">Upload Images</Text>
        <TouchableOpacity
          onPress={handlePickImages}
          className="bg-blue-600 rounded-xl py-3 mb-4"
        >
          <Text className="text-white text-center font-medium">Choose Images</Text>
        </TouchableOpacity>

        <ScrollView horizontal className="mb-6">
          {images.map((img, i) => (
            <Image key={i} source={{ uri: img }} className="w-24 h-24 mr-2 rounded" />
          ))}
        </ScrollView>

        <TouchableOpacity
          onPress={handleCreate}
          className="bg-black rounded-xl py-4 mb-10"
          disabled={loading}
        >
          <Text className="text-white text-center font-bold text-base">
            Create Post
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {loading && (
        <View className="absolute top-0 left-0 right-0 bottom-0 z-50 bg-black/40 items-center justify-center">
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Cancel Post", "Do you want to cancel post creation?", [
                { text: "No" },
                { text: "Yes", onPress: () => setLoading(false) },
              ]);
            }}
            className="absolute top-10 right-6 z-50"
          >
            <Feather name="x" size={28} color="white" />
          </TouchableOpacity>
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-2 font-semibold">Creating post...</Text>
        </View>
      )}
    </View>
  );
};

export default Create;
