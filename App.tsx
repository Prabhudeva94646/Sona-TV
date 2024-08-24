import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Button, StyleSheet, BackHandler, Dimensions, TouchableOpacity, Platform, Alert } from 'react-native';
import WebView from 'react-native-webview';
import KeepAwake from 'react-native-keep-awake'; // Import KeepAwake
import Orientation from 'react-native-orientation-locker'; // Import Orientation
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const App = () => {
  const defaultUrl = 'https://digital.sonalika.com:7011/QCMS_TV_APP/frm_Display?TV_ID=';
  const [token, setToken] = useState('');
  const [urlWithToken, setUrlWithToken] = useState(defaultUrl);
  const [submitted, setSubmitted] = useState(false);
  const [currentView, setCurrentView] = useState('generateToken');
  const [enterPressed, setEnterPressed] = useState(false); // State to track whether Enter key was pressed
  const webviewRef = useRef(null);
  const tokenInputRef = useRef(null); // Ref for token input
  const [showFloatingWindow, setShowFloatingWindow] = useState(false);

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    lockToLandscape();
  }, []);

  useEffect(() => {
    if (currentView === 'generateToken') {
      // Focus on the token input when the component mounts and the current view is 'generateToken'
      tokenInputRef.current && tokenInputRef.current.focus(); // Added a null check
    }
  }, [currentView]);

  useEffect(() => {
    if (enterPressed) {
      // If Enter key was pressed, focus on the token input again
      tokenInputRef.current && tokenInputRef.current.focus();
      setEnterPressed(false); // Reset the state
    }
  }, [enterPressed]);

  const generateRandomToken = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const generateToken = () => {
    const tokenLength = Math.floor(Math.random() * (16 - 8 + 1)) + 8;
    const generatedToken = generateRandomToken(tokenLength);
    setToken(generatedToken);
    setUrlWithToken(defaultUrl + generatedToken);
    setCurrentView('generateToken');
    setShowFloatingWindow(true);

    setTimeout(() => {
      setShowFloatingWindow(false);
    }, 10000);
  };

  const handleSubmit = () => {
    if (token && token.length >= 8 && token.length <= 16) {
      saveToken(token);
      setSubmitted(true);
      setCurrentView('webView');
    } else {
      alert('Token must be between 8 and 16 characters long and contain at least one character.');
    }
  };

  const handleBack = () => {
    if (currentView === 'webView') {
      Alert.alert(
        'Exit App',
        'Do you want to exit the app?',
        [
          { text: 'Cancel', onPress: () => null, style: 'cancel' },
          { text: 'OK', onPress: () => BackHandler.exitApp() },
        ],
        { cancelable: false }
      );
      return true;
    } else {
      return false;
    }
  };

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handleBack);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBack);
    };
  }, [currentView]);

  const lockToLandscape = () => {
    Orientation.lockToLandscape();
  };

  const handleTokenChange = (inputToken) => {
    setToken(inputToken);
    setUrlWithToken(defaultUrl + inputToken);
  };

  const handleTokenSubmit = () => {
    // Focus on the submit button when the user submits the token input
    handleSubmit();
  };

  const handleEnterPress = () => {
    // Set the state to indicate that Enter key was pressed
    setEnterPressed(true);
  };

  const FloatingWindow = () => {
    return (
      <TouchableOpacity style={styles.floatingWindow} onPress={generateToken}>
        <Text style={styles.floatingWindowText}>{token}</Text>
      </TouchableOpacity>
    );
  };

  const clearAndNavigate = async () => {
    try {
      await AsyncStorage.clear();
      setToken('');
      setCurrentView('generateToken');
      setSubmitted(false);
    } catch (error) {
      console.log('Error clearing AsyncStorage:', error);
    }
  };

  const saveToken = async (token) => {
    try {
      await AsyncStorage.setItem('token', token);
    } catch (error) {
      console.log('Error saving token:', error);
    }
  };

  const loadToken = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      if (savedToken) {
        setToken(savedToken);
        setUrlWithToken(defaultUrl + savedToken);
        setCurrentView('webView');
        setSubmitted(true);
      }
    } catch (error) {
      console.log('Error loading token:', error);
    }
  };

  const handleNavigationStateChange = (navState) => {
    if (navState.canGoBack) {
      setShowFloatingWindow(false);
    } else {
      setShowFloatingWindow(true);
    }
  };

  const focusOnTokenInput = () => {
    tokenInputRef.current && tokenInputRef.current.focus();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.container}>
        {currentView === 'generateToken' ? (
          <View>
            <TextInput
              style={styles.input}
              value={urlWithToken}
              editable={false}
            />
            <TextInput
              ref={tokenInputRef}
              style={styles.input}
              value={token}
              onChangeText={handleTokenChange}
              onSubmitEditing={handleTokenSubmit} // Call handleTokenSubmit when the user submits the token input
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Enter') {
                  handleEnterPress(); // Call handleEnterPress when Enter key is pressed
                }
              }}
              placeholder="Enter Token"
            />
            <View style={styles.buttonContainer}>
              <Button title="Generate Token" onPress={generateToken} />
              <Button title="Edit Token" onPress={focusOnTokenInput} />
              <Button title="Submit" onPress={handleSubmit} disabled={!token || token.length < 8 || token.length > 16} />
            </View>
          </View>
        ) : (
          <View style={{ width, height: height * 0.9, position: 'relative' }}>
              <TouchableOpacity style={styles.clearButton} onPress={clearAndNavigate}>
                <Text style={styles.clearButtonText}>Clear & Navigate</Text>
              </TouchableOpacity>
            <KeepAwake />
            {showFloatingWindow && <FloatingWindow />}
            <View style={styles.webViewContainer}>
              <WebView
                ref={webviewRef}
                source={{ uri: urlWithToken }}
                style={{ flex: 1 }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onNavigationStateChange={handleNavigationStateChange}
                ignoreSslError={true}
              />
              </View>
          </View>
        )}
      </View>
    </ScrollView>

  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    width: width - 40,
  },
   ScrollView: {
      width: '100%',
      height: '100%',
    },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  webViewContainer: {
      width: '100%',
      height: '100%',
    },
floatingWindow: {
    position: 'absolute',
    bottom: 20, // Changed from 'top' to 'bottom'
    left: 20, // Changed from 'right' to 'left'
    backgroundColor: '#333',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  floatingWindowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    position: 'relative',
    height: 30,
    width: 150,
    //bottom: 20,
    //left: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    //padding: 10,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;