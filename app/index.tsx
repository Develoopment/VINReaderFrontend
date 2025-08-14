import {
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState } from "react";
import { Button, Pressable, StyleSheet, Text, View, ActivityIndicator, FlatList } from "react-native";
import { Image } from "expo-image";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);

  const [information, setInformation] = useState({});
  const [isLoading, setLoading] = useState<boolean>(false)

  const [selectedFilters, setSelectedFilters] = useState([]);


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

    //set loading to true so that the spinner renders
    setLoading(true);

    const fileName = imageUri.split('/').pop();
    const fileType = fileName.split('.').pop();

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type: `image/${fileType}`,
    });
    //adding the filters to the request so that the backend scraper only scrapes for those reducing time
    formData.append("filters", JSON.stringify(selectedFilters))


    try {
      console.log("sending image now")

      const response = await fetch('http://192.168.1.119:5000/ReadInfo', {
        method: 'POST',
        body: formData,
      });

      const results = await response.json();
      // const res_info = JSON.parse(result)
      console.log("api has responded");
      console.log(results)
      setInformation(results);
      
    } catch (error) {
      console.error('Error uploading image:', error);
    }finally{
      //set loading to false so the spinner is unmounted
      setLoading(false);
    }

  };

  //function to take pictures
  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    setUri(photo?.uri);
  };

  //to display the picture once it has been taken
  const renderPicture = () => {

    const filterOptions = [
      "Cabin Air Filter",
      "Engine Air Filter",
      "Oil Capacity",
      "Oil Filters",
      "Oil Types",
    ];

    const toggleFilter = (option) => {
      if (selectedFilters.includes(option)) {
        setSelectedFilters(selectedFilters.filter((item) => item !== option));
      } else {
        setSelectedFilters([...selectedFilters, option]);
      }
    };

    return (
      <View style={styles.pictureContainer}>
      {/* Picture preview */}
      <Image
        source={{ uri }}
        contentFit="contain"
        style={styles.picturePreview}
      />

      {/* Retake button */}
      <Button
        onPress={() => {
          setUri(null);
          setInformation({});
          setSelectedFilters([]);
        }}
        title="Retake Picture"
        color="#555"
      />

      {/* Filter checkboxes */}
      <Text style={styles.filtersHeader}>Select items to search for:</Text>
      {filterOptions.map((option) => {
        const isChecked = selectedFilters.includes(option);
        return (
          <Pressable
            key={option}
            onPress={() => toggleFilter(option)}
            style={[
              styles.optionRow,
              isChecked && styles.optionSelected,
            ]}
          >
            <View style={[styles.checkbox, isChecked && styles.checkboxChecked]} />
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        );
      })}

      {/* Confirm button */}
      <Pressable
        onPress={() => sendImageToBackend(uri, selectedFilters)}
        style={styles.confirmButton}
      >
        <Text style={styles.confirmButtonText}>Confirm Picture</Text>
      </Pressable>
    </View>
      // <View>
      //   <Image
      //     source={{ uri }}
      //     contentFit="contain"
      //     style={{ width: 500, aspectRatio: 1 }}
      //   />
      //   <Button onPress={() => {
      //     setUri(null)
      //     setInformation({})
      //     }} title="Retake Picture" />
      //   <Button onPress={() => {
      //     console.log(uri)
      //     sendImageToBackend(uri)
      //   }} title="Confirm Picture" />
      // </View>
    );
  };

  //delete this once confirmed
  const render_information = () => {

    console.log("API Responded");
    const entries = Object.entries(information);

    return(
      <View style={styles.output_container}>
      <FlatList
        data={entries}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => {
          const [label, value] = item;
          return (
            <View style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>
                {value && value.trim() !== "" ? value : "N/A"}
              </Text>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={{backgroundColor:"black"}}>
        <Button onPress={() => {
          setUri(null)
          setInformation({})
          }} 
        title="Scan New RO" 
        color="white"
        />
      </View>

      </View>
    )
  }

  //main code to show the user the camera interface
  const renderCamera = () => {
    return (

      <View style={styles.crate}>
        <CameraView
          style={styles.camera}
          ref={ref}
          mode={"picture"}
          facing={"back"}
          mute={false}
          responsiveOrientationWhenOrientationLocked
        >
          
        </CameraView>

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
                      backgroundColor: "#d3d3d3"
                    },
                  ]}
                />
              </View>
            )}
          </Pressable>

        </View>
        
      </View>
      
    );
  };


  //deciding whether to render the actual camera of the picture
  return (
    <View style={styles.container}>
      {Object.keys(information).length > 0 ? (
      render_information() // Only show the list
    ) : (

      uri ? renderPicture() : renderCamera() // Otherwise show camera flow
    )}

    {isLoading && (
      <View>
        <ActivityIndicator size="large" color="#2929cdff"/>
        <Text>Waiting on response</Text>
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  //checkboxes styling
  pictureContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  picturePreview: {
    width: "100%",
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 8,
  },
  filtersHeader: {
    fontWeight: "bold",
    fontSize: 16,
    marginVertical: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  optionSelected: {
    backgroundColor: "#e0e0ff",
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#555",
    borderRadius: 4,
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: "#2929cd",
  },
  optionText: {
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: "#2929cd",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  
  //list styling
  output_container:{
    padding: 20,
    backgroundColor: "#fff",
    maxHeight: 600
  },
  row: {
    paddingVertical: 15
  },
  label: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4
  },
  value: {
    fontSize: 14,
    color: "#555"
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8
  },


  //camera and picture render styling
  crate: {
    width: "100%",
    height: "90%",
    
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffe4",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
    borderWidth: 3,
  },
  shutterContainer: {
    backgroundColor: "transparent",
    // position: "absolute",
    // bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "#d3d3d3",
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