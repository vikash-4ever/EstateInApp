import React, { useState, useEffect } from "react";
import MapView, { Marker } from "react-native-maps";
import { View, Text, Image, Dimensions, Modal, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { getProperties } from "@/lib/appwrite"; // Adjust the import as necessary
import { useRouter } from "expo-router";
import icons from "@/constants/icons";

const MapScreen = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await getProperties({
          filter: "All",
          query: "",
          limit: 100,
        });

        const parsedProperties = data
          .map((property: any, index: number) => {
            try {
              const meta = JSON.parse(property.meta);
              const location = meta?.geolocation;
              if (location?.lat && location?.lng) {
                return {
                  ...property,
                  latitude: location.lat,
                  longitude: location.lng,
                };
              } else {
                console.warn(`Skipping property ${index} due to missing coordinates`);
                return null;
              }
            } catch (error) {
              console.error(`Error parsing meta for property ${index}:`, error);
              return null;
            }
          })
          .filter(Boolean);

        setProperties(parsedProperties);
      } catch (err) {
        console.error("Failed to fetch properties:", err);
      }
    };

    fetchProperties();
  }, []);

  const handleMarkerPress = (property: any) => {
    setSelectedProperty(property);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedProperty(null);
  };

  const handleNavigateToDetails = () => {
    if (selectedProperty) {
      router.push(`/properties/${selectedProperty.$id}`);
      setModalVisible(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => router.back()} className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center absolute top-5 left-5 z-10">
            <Image source={icons.backArrow} className="size-5" />
        </TouchableOpacity>
      <MapView
        style={{
          width: Dimensions.get("window").width,
          height: Dimensions.get("window").height,
        }}
        initialRegion={{
          latitude: 24.554548,
          longitude: 81.314764,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {properties.map((property, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: property.latitude,
              longitude: property.longitude,
            }}
            onPress={() => handleMarkerPress(property)}
          >
            {/* Custom Marker Icon */}
            <Image
                source={icons.location}
                style={{ width: 32, height: 32 }}
                resizeMode="contain"
                tintColor={"green"}
            />
          </Marker>
        ))}
      </MapView>

      {/* Modal for displaying property details */}
      {selectedProperty && modalVisible && (
        <TouchableWithoutFeedback onPress={handleCloseModal}>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  width: 250,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: "white",
                  alignItems: "center",
                  position: "absolute",
                  zIndex: 1,
                }}
              >
                <Image
                  source={{ uri: selectedProperty.images?.[0] }}
                  style={{
                    width: 200,
                    height: 100,
                    borderRadius: 8,
                    marginBottom: 10,
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity onPress={handleNavigateToDetails}>
                  <Text style={{ fontWeight: "bold", fontSize: 14 }} numberOfLines={1}>
                    {selectedProperty.name}
                  </Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 12, color: "#666" }} numberOfLines={3}>
                  {selectedProperty.description}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

export default MapScreen;
