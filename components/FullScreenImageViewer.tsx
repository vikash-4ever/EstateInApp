import React, { useEffect } from "react";
import { BackHandler, View } from "react-native";
import Modal from "react-native-modal";
import ImageViewer from "react-native-image-zoom-viewer";

interface FullScreenImageViewerProps {
  visible: boolean;
  images: { url: string }[]; 
  currentIndex: number;
  onClose: () => void;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
}

const FullScreenImageViewer = ({
  visible,
  images,
  currentIndex,
  onClose,
  swipeToCloseEnabled = true,
  doubleTapToZoomEnabled = true,
}: FullScreenImageViewerProps) => {
 
  return (
    <Modal
      isVisible={visible}
      style={{ margin: 0 }}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      onBackButtonPress={onClose}
      swipeDirection="down"
      animationIn="fadeIn"
      animationOut="fadeOut"
      useNativeDriver
    >
      <View style={{ flex: 1, backgroundColor: "black" }}>
      <ImageViewer
        imageUrls={images}
        index={currentIndex}
        enableSwipeDown={swipeToCloseEnabled}
        onSwipeDown={onClose}
        onCancel={onClose}
        saveToLocalByLongPress={false}
        swipeDownThreshold={50}
      />
      </View>
    </Modal>
  );
};

export default FullScreenImageViewer;
