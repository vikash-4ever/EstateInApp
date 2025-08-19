import icons from "@/constants/icons";
import { logout, updateUserProfile, uploadFile } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import * as ImagePicker from "expo-image-picker";
import { Modal } from "react-native";
import { router, useRouter } from "expo-router";
import React, { useState } from "react";
import { View, Text, Alert, SafeAreaView, ScrollView, Image, TouchableOpacity, ImageSourcePropType } from "react-native";
import NotificationIcon from "@/components/NotificationIcon";

interface SettingsItemProps{
    icon: ImageSourcePropType;
    title: string;
    onPress?: () => void;
    textStyle?: string;
    showArrow?: boolean;
}

const SettingsItem = ({ icon, title, onPress, textStyle}: SettingsItemProps) => (
    <TouchableOpacity onPress={onPress} className="flex flex-row items-center justify-between py-3 px-2">
        <View className="flex flex-row items-center gap-5 ">
            <Image source={icon} className="size-6 ml-3"/>
            <Text className={`text-lg font-rubik-medium text-black-300 ${textStyle}`}>{title}</Text>
        </View>
        
    </TouchableOpacity>
)

const Profile = () => {

    const { userProfile, refetch } = useGlobalContext();
    const router = useRouter();

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
      setModalVisible(true);
    }
    };

  const handleUpload = async () => {
    try {
      setUploading(true);
      if (!selectedImage) return;

      const uploadedFileUrl = await uploadFile(selectedImage); // Upload to Appwrite storage
      if (!uploadedFileUrl) throw new Error("Upload failed");

      await updateUserProfile(userProfile!.$id, { avatar: uploadedFileUrl });
      refetch();
      Alert.alert("Success", "Your profile picture has been updated.");
    } catch (error) {
      console.error("Avatar upload error:", error);
    } finally {
      setUploading(false);
      setModalVisible(false);
      setSelectedImage(null);
    }
  };


    const handleLogout = async () => {
        const result = await logout();

        if(result) {
            Alert.alert("Success", "You have been Logged Out Successfully");
            refetch();
        }else{
            Alert.alert("Error", "An error occurred whilie logging out!");
        }
    };

    return (
        <View className="flex-1 bg-white">
            <View className="px-6">
                <View className="flex flex-row items-center justify-between mt-7">
                    <Text className="text-xl ml-2 font-rubik-bold">Profile</Text>
                    <NotificationIcon/>
                </View>
                <View className="flex-row justify-center flex mt-2 pb-5 border-b border-primary-200">
                    <View className="flex flex-col items-center relative mt-5">
                        <Image source={{uri: userProfile?.avatar}} className="size-32 relative rounded-full"/>
                        <TouchableOpacity onPress={pickImage} className="absolute bottom-11 right-10">
                            <Image source={icons.edit} className="size-6" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-rubik-semibold mt-2 color-black-200">{userProfile?.name}</Text>
                    </View>
                </View>
            </View> 

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-32 px-6"
            >   
                

                <View className="flex flex-col mt-5">
                    <SettingsItem icon={icons.create} title="Create" onPress={()=> router.push("/(root)/create")}/>
                    <SettingsItem icon={icons.heart} title="Favourites" onPress={()=> router.push("/(root)/favorites")}/>
                    <SettingsItem icon={icons.send} title="Messages" onPress={()=> router.push("/(root)/chats")}/>
                    <SettingsItem icon={icons.properties} title="My Properties" onPress={()=> router.push("/(root)/properties")}/>
                    <SettingsItem icon={icons.request} title="Booking Requests" onPress={()=> router.push("/(root)/bookingRequests")}/>
                </View>

                <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
                    <SettingsItem icon={icons.shield} title="Security" onPress={()=> router.push("/(root)/security")}/>
                    <SettingsItem icon={icons.info} title="About Us" onPress={()=> router.push("/(root)/aboutUs")}/>
                    <SettingsItem icon={icons.help} title="Help" onPress={()=> router.push("/(root)/help")}/>
                </View>
                <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
                    <SettingsItem icon={icons.logout} title="Logout" textStyle="text-danger" showArrow={false} onPress={handleLogout}/>
                </View>
            </ScrollView>
            {/* Image Preview Modal */}
            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <View className="flex-1 justify-center items-center bg-black bg-opacity-70 px-5">
                {selectedImage && (
                    <Image source={{ uri: selectedImage }} className="w-60 h-60 rounded-xl mb-5" />
                )}
                <View className="flex-row gap-5">
                    <TouchableOpacity onPress={pickImage} className="bg-white py-2 px-4 rounded-lg">
                    <Text className="text-black font-semibold">Choose Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-red-500 py-2 px-4 rounded-lg">
                    <Text className="text-white font-semibold">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleUpload} disabled={uploading} className="bg-green-500 py-2 px-4 rounded-lg">
                    <Text className="text-white font-semibold">{uploading ? "Uploading..." : "Done"}</Text>
                    </TouchableOpacity>
                </View>
                </View>
            </Modal>
        </View>
    )
}

export default Profile;