import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState } from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import * as FileSystem from 'expo-file-system';


export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);

  const [characters, setCharacters] = useState(null);

  if (!permission) {
    return null;
  }

  //ask to get camera permissions if not already granted
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  //function to send picture to the backend
  const sendImageToBackend = async (imageUri) => {
    const fileName = imageUri.split('/').pop();
    const fileType = fileName.split('.').pop();

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type: `image/${fileType}`,
    });

    try {
      const response = await fetch('http://192.168.1.119:5000/ReadVIN', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('Result from server:', result);
      setCharacters(result.VINTEXT[1])
      
    } catch (error) {
      console.error('Error uploading image:', error);
    }

  };

  //function to take pictures
  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    setUri(photo?.uri);
  };

  //to display the picture once it has been taken
  const renderPicture = () => {
    return (
      <View>
        <Image
          source={{ uri }}
          contentFit="contain"
          style={{ width: 300, aspectRatio: 1 }}
        />
        <Button onPress={() => setUri(null)} title="Retake Picture" />
        <Button onPress={() => {
          console.log(uri)
          sendImageToBackend(uri)
        }} title="Confirm Picture" />
      </View>
    );
  };

  //delete this once confirmed
  const render_apicall = () => {

    console.log("API Responded")

    return(
      <View>
        <Text>{characters}</Text>
      </View>
    )
  }

  //main code to show the user the camera interface
  const renderCamera = () => {
    return (
      <CameraView
        style={styles.camera}
        ref={ref}
        mode={"picture"}
        facing={"back"}
        mute={false}
        responsiveOrientationWhenOrientationLocked
      >
        <View style={styles.shutterContainer}>

          {/* icon for taking a picture */}
          <Pressable onPress={takePicture}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
              <View
                  style={[
                    styles.shutterBtnInner,
                    {
                      backgroundColor: "white"
                    },
                  ]}
                />
              </View>
            )}
          </Pressable>

        </View>
      </CameraView>
    );
  };

  //deciding whether to render the actual camera of the picture
  return (
    <View style={styles.container}>
      {uri ? renderPicture() : renderCamera()}
      {characters ? render_apicall() : <Text>Waiting</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
    width: "100%"
  },
  shutterContainer: {
    backgroundColor: "transparent",
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  }
})