import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, 
  Image, ScrollView, Modal, TextInput, PanResponder,
  ActivityIndicator, Dimensions
} from 'react-native';
import { Video } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Backend URL - Change to your computer's IP
const BACKEND_URL = 'http://192.168.1.5:8000'; // REPLACE WITH YOUR IP

// ✅ GOOGLE DRIVE ASSIGNMENT FILES
const ASSIGNMENT_FILES = {
  videos: [
    {
      id: '1nj07uY0sBiWIubpuXCSbVpoVStTG-Cgs',
      name: 'B-roll 1.mp4',
      type: 'video/mp4',
      downloadUrl: 'https://drive.google.com/uc?export=download&id=1nj07uY0sBiWIubpuXCSbVpoVStTG-Cgs'
    },
    {
      id: '10B_EAjBAI3OdsDkcO1WXPBwXWN3bCJZx', 
      name: 'B-roll 2.mp4',
      type: 'video/mp4',
      downloadUrl: 'https://drive.google.com/uc?export=download&id=10B_EAjBAI3OdsDkcO1WXPBwXWN3bCJZx'
    }
  ],
  images: [
    {
      id: '1HdmOW2qKTymMrTRoe9EvQYuZ-de206TK',
      name: 'Image Overlay (1).png',
      type: 'image/png',
      downloadUrl: 'https://drive.google.com/uc?export=download&id=1HdmOW2qKTymMrTRoe9EvQYuZ-de206TK'
    }
  ]
};

export default function VideoEditor() {
  // State Management
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [overlays, setOverlays] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentOverlay, setCurrentOverlay] = useState(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const [overlayText, setOverlayText] = useState('Hello World!');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [draggingOverlay, setDraggingOverlay] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const videoRef = useRef(null);

  // ✅ Video Controls
  const playVideo = async () => {
    if (videoRef.current) {
      await videoRef.current.playAsync();
    }
  };

  const pauseVideo = async () => {
    if (videoRef.current) {
      await videoRef.current.pauseAsync();
    }
  };

  const restartVideo = async () => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(0);
    }
  };

  // ✅ Drag & Drop with PanResponder
  const createPanResponder = (overlay) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDraggingOverlay(overlay.id);
      },
      onPanResponderMove: (evt, gestureState) => {
        const updatedOverlays = overlays.map(ov => {
          if (ov.id === overlay.id) {
            const newX = Math.max(10, Math.min(SCREEN_WIDTH - 100, ov.position.x + gestureState.dx));
            const newY = Math.max(10, Math.min(200, ov.position.y + gestureState.dy));
            
            return {
              ...ov,
              position: { x: newX, y: newY }
            };
          }
          return ov;
        });
        setOverlays(updatedOverlays);
      },
      onPanResponderRelease: () => {
        setDraggingOverlay(null);
      }
    });
  };

  // ✅ Backend Connection Test
  const testBackendConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/`);
      const data = await response.json();
      Alert.alert('✅ Backend Connected!', data.message);
    } catch (error) {
      Alert.alert('❌ Connection Failed', 'Make sure backend is running on port 8000');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Video Selection with Google Drive Files
  const handleSelectVideo = () => {
    Alert.alert(
      'Select Video Source',
      'Choose from assignment files or your device:',
      [
        {
          text: '📹 B-roll 1.mp4 (Google Drive)',
          onPress: () => {
            const video = ASSIGNMENT_FILES.videos[0];
            setSelectedVideo({
              uri: video.downloadUrl,
              name: video.name,
              type: video.type
            });
            setOverlays([]);
            Alert.alert('✅ Video Selected', 'B-roll 1.mp4 loaded from Google Drive');
          }
        },
        {
          text: '📹 B-roll 2.mp4 (Google Drive)',
          onPress: () => {
            const video = ASSIGNMENT_FILES.videos[1];
            setSelectedVideo({
              uri: video.downloadUrl,
              name: video.name,
              type: video.type
            });
            setOverlays([]);
            Alert.alert('✅ Video Selected', 'B-roll 2.mp4 loaded from Google Drive');
          }
        },
        {
          text: '📁 Choose from Device',
          onPress: () => selectDeviceVideo()
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Device se video select karna
  const selectDeviceVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true
      });
      
      if (result.assets && result.assets[0]) {
        setSelectedVideo(result.assets[0]);
        setOverlays([]);
        Alert.alert('✅ Video Selected', 'Device video loaded successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select video');
    }
  };

  // ✅ Add Text Overlay
  const addTextOverlay = () => {
    setCurrentOverlay({ type: 'text' });
    setModalVisible(true);
  };

  // ✅ Add Image Overlay with Google Drive Option
  const addImageOverlay = () => {
    Alert.alert(
      'Select Image Overlay',
      'Choose image source:',
      [
        {
          text: '🖼️ Google Drive Image',
          onPress: () => {
            const image = ASSIGNMENT_FILES.images[0];
            setCurrentOverlay({ 
              type: 'image',
              content: image.downloadUrl,
              name: image.name
            });
            setModalVisible(true);
          }
        },
        {
          text: '📁 Choose from Device',
          onPress: () => selectDeviceImage()
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Device se image select karna
  const selectDeviceImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCurrentOverlay({ 
          type: 'image',
          content: result.assets[0].uri,
          name: 'Device Image'
        });
        setModalVisible(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // ✅ Save Overlay
  const saveOverlay = () => {
    const newOverlay = {
      id: Date.now().toString(),
      type: currentOverlay.type,
      content: currentOverlay.type === 'text' ? overlayText : currentOverlay.content,
      name: currentOverlay.name || (currentOverlay.type === 'text' ? 'Text Overlay' : 'Image Overlay'),
      position: { x: 50, y: 50 },
      startTime: startTime,
      endTime: endTime,
      fontSize: currentOverlay.type === 'text' ? 24 : undefined,
      color: '#FFFFFF'
    };

    setOverlays([...overlays, newOverlay]);
    setModalVisible(false);
    
    Alert.alert('✅ Overlay Added', `${newOverlay.name} added successfully`);
  };

  // ✅ Remove Overlay
  const removeOverlay = (id) => {
    setOverlays(overlays.filter(ov => ov.id !== id));
  };

  // ✅ Submit to Backend
  const handleSubmit = async () => {
    if (!selectedVideo) {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    if (overlays.length === 0) {
      Alert.alert('Error', 'Please add at least one overlay');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      
      // Add video file
      formData.append('video', {
        uri: selectedVideo.uri,
        type: selectedVideo.mimeType || 'video/mp4',
        name: selectedVideo.name || 'video.mp4'
      });

      // Add image overlay if exists
      const imageOverlay = overlays.find(ov => ov.type === 'image');
      if (imageOverlay) {
        formData.append('image', {
          uri: imageOverlay.content,
          type: 'image/jpeg',
          name: 'overlay.jpg'
        });
      }

      // Prepare overlays data
      const overlaysData = overlays.map(ov => ({
        type: ov.type,
        content: ov.content,
        position: ov.position,
        start_time: ov.startTime,
        end_time: ov.endTime
      }));

      formData.append('overlays', JSON.stringify(overlaysData));

      console.log('Submitting to backend...');

      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      Alert.alert(
        '🎉 Processing Started!', 
        `Your video is being processed\nJob ID: ${result.job_id}`,
        [{ text: 'OK' }]
      );

      // Start monitoring progress
      monitorProgress(result.job_id);

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('❌ Upload Failed', 'Please check backend connection');
      setLoading(false);
    }
  };

  // ✅ Monitor Processing Progress
  const monitorProgress = async (jobId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/status/${jobId}`);
      const status = await response.json();
      
      console.log('Progress:', status);

      if (status.status === 'completed') {
        setDownloadUrl(`${BACKEND_URL}/result/${jobId}`);
        setLoading(false);
        setProgress(100);
        Alert.alert(
          '✅ Processing Complete!', 
          'Your video is ready to download',
          [{ text: '🎉 Download Now' }]
        );
      } 
      else if (status.status === 'processing') {
        setProgress(status.progress || 50);
        setTimeout(() => monitorProgress(jobId), 1000);
      } 
      else if (status.status === 'failed') {
        setLoading(false);
        Alert.alert('❌ Processing Failed', status.error || 'Please try again');
      }
      else if (status.status === 'queued') {
        setProgress(10);
        setTimeout(() => monitorProgress(jobId), 2000);
      }
    } catch (error) {
      console.error('Progress check error:', error);
      setLoading(false);
    }
  };

  // ✅ Download Processed Video
  const handleDownload = () => {
    if (downloadUrl) {
      Alert.alert(
        '📥 Download Ready',
        'Your processed video is ready!\n\nYou can access it at: ' + downloadUrl,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎬 Video Editor</Text>
      
      {/* Connection Test */}
      <TouchableOpacity style={styles.connectionButton} onPress={testBackendConnection}>
        <Text style={styles.buttonText}>🔗 Test Backend Connection</Text>
      </TouchableOpacity>

      {/* Video Preview Section */}
      <View style={styles.videoPreview}>
        {selectedVideo ? (
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: selectedVideo.uri }}
              style={styles.videoPlayer}
              useNativeControls
              resizeMode="contain"
              isLooping
            />
            
            {/* Video Controls */}
            <View style={styles.videoControls}>
              <TouchableOpacity style={styles.controlButton} onPress={playVideo}>
                <Text style={styles.controlText}>▶️ Play</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={pauseVideo}>
                <Text style={styles.controlText}>⏸️ Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={restartVideo}>
                <Text style={styles.controlText}>🔁 Restart</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.videoInfo}>
              📹 {selectedVideo.name}
              {selectedVideo.uri.includes('drive.google.com') && ' (Google Drive)'}
            </Text>
            
            {/* Draggable Overlays */}
            {overlays.map(overlay => {
              const panResponder = createPanResponder(overlay);
              
              return (
                <View
                  key={overlay.id}
                  {...panResponder.panHandlers}
                  style={[
                    styles.overlay,
                    { 
                      left: overlay.position.x, 
                      top: overlay.position.y,
                      opacity: draggingOverlay === overlay.id ? 0.9 : 1,
                      transform: [{ scale: draggingOverlay === overlay.id ? 1.05 : 1 }]
                    }
                  ]}
                >
                  {overlay.type === 'text' && (
                    <Text style={[
                      styles.overlayText,
                      { fontSize: overlay.fontSize, color: overlay.color }
                    ]}>
                      {overlay.content}
                    </Text>
                  )}
                  
                  {overlay.type === 'image' && (
                    <Image 
                      source={{ uri: overlay.content }} 
                      style={styles.overlayImage} 
                    />
                  )}
                  
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => removeOverlay(overlay.id)}
                  >
                    <Text style={styles.deleteText}>×</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.timeInfo}>
                    {overlay.startTime}s - {overlay.endTime}s
                  </Text>
                  <Text style={styles.dragHint}>👆 Drag</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <TouchableOpacity style={styles.placeholder} onPress={handleSelectVideo}>
            <Text style={styles.placeholderText}>📹 Tap to Select Video</Text>
            <Text style={styles.placeholderSubtext}>Choose from Google Drive assignment files or your device</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Controls Section */}
      <ScrollView style={styles.controls} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.mainButton} onPress={handleSelectVideo}>
          <Text style={styles.buttonText}>📁 Select Video</Text>
        </TouchableOpacity>

        {selectedVideo && (
          <>
            {/* Assignment Files Info */}
            <View style={styles.filesInfo}>
              <Text style={styles.filesTitle}>📂 Assignment Files Available:</Text>
              <Text style={styles.fileItem}>• B-roll 1.mp4 (Google Drive)</Text>
              <Text style={styles.fileItem}>• B-roll 2.mp4 (Google Drive)</Text>
              <Text style={styles.fileItem}>• Image Overlay (1).png (Google Drive)</Text>
            </View>

            <Text style={styles.sectionTitle}>Add Overlays:</Text>
            <View style={styles.overlayButtons}>
              <TouchableOpacity style={styles.overlayOption} onPress={addTextOverlay}>
                <Text style={styles.overlayOptionText}>📝 Text Overlay</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.overlayOption} onPress={addImageOverlay}>
                <Text style={styles.overlayOptionText}>🖼️ Image Overlay</Text>
              </TouchableOpacity>
            </View>

            {/* Overlay Statistics */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                📊 {overlays.length} Overlay{overlays.length !== 1 ? 's' : ''} Added
              </Text>
              <Text style={styles.statsHint}>
                💡 Drag overlays to reposition • Tap × to remove
              </Text>
            </View>

            {/* Process Button */}
            <TouchableOpacity 
              style={[
                styles.submitButton, 
                (loading || overlays.length === 0) && styles.disabledButton
              ]} 
              onPress={handleSubmit}
              disabled={loading || overlays.length === 0}
            >
              <Text style={styles.buttonText}>
                {loading ? `🔄 Processing... ${progress}%` : '🚀 Process Video'}
              </Text>
            </TouchableOpacity>

            {/* Download Button */}
            {downloadUrl && (
              <TouchableOpacity 
                style={styles.downloadButton}
                onPress={handleDownload}
              >
                <Text style={styles.downloadText}>📥 Download Processed Video</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Processing Your Video...</Text>
          <Text style={styles.loadingSubtext}>
            This usually takes 10-30 seconds{'\n'}
            Please don't close the app
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}% Complete</Text>
        </View>
      )}

      {/* Overlay Configuration Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add {currentOverlay?.type === 'text' ? 'Text' : 'Image'} Overlay
            </Text>
            
            {currentOverlay?.type === 'text' && (
              <TextInput
                style={styles.textInput}
                value={overlayText}
                onChangeText={setOverlayText}
                placeholder="Enter text for overlay"
                placeholderTextColor="#999"
                multiline
              />
            )}

            {currentOverlay?.type === 'image' && (
              <View style={styles.imagePreview}>
                <Image 
                  source={{ uri: currentOverlay.content }} 
                  style={styles.previewImage} 
                />
                <Text style={styles.imageInfo}>
                  {currentOverlay.name}
                  {currentOverlay.content.includes('drive.google.com') && ' (Google Drive)'}
                </Text>
              </View>
            )}

            <View style={styles.timeSection}>
              <Text style={styles.timeLabel}>Start Time (seconds):</Text>
              <TextInput
                style={styles.timeInput}
                value={startTime.toString()}
                onChangeText={(text) => setStartTime(Number(text) || 0)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.timeSection}>
              <Text style={styles.timeLabel}>End Time (seconds):</Text>
              <TextInput
                style={styles.timeInput}
                value={endTime.toString()}
                onChangeText={(text) => setEndTime(Number(text) || 10)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  setModalVisible(false);
                  setOverlayText('Hello World!');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.saveButton, 
                  currentOverlay?.type === 'text' && !overlayText.trim() && styles.disabledButton
                ]} 
                onPress={saveOverlay}
                disabled={currentOverlay?.type === 'text' && !overlayText.trim()}
              >
                <Text style={styles.saveButtonText}>
                  Add {currentOverlay?.type === 'text' ? 'Text' : 'Image'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#f8f9fa',
    paddingTop: 60 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 20, 
    color: '#2c3e50' 
  },
  connectionButton: { 
    backgroundColor: '#6f42c1', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 15 
  },
  videoPreview: { 
    height: 320, 
    backgroundColor: '#000', 
    borderRadius: 12, 
    marginBottom: 20, 
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#dee2e6'
  },
  videoContainer: { 
    flex: 1, 
    position: 'relative' 
  },
  videoPlayer: {
    width: '100%',
    height: '70%',
    backgroundColor: '#000'
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.8)'
  },
  controlButton: {
    padding: 8,
    backgroundColor: '#007bff',
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center'
  },
  controlText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  videoInfo: { 
    position: 'absolute', 
    top: 10, 
    left: 10, 
    color: 'white', 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    padding: 8, 
    borderRadius: 8,
    fontSize: 12
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef'
  },
  placeholderText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 5
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center'
  },
  overlay: { 
    position: 'absolute', 
    padding: 10, 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007bff',
    borderStyle: 'dashed',
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5
  },
  overlayText: { 
    color: 'black',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  overlayImage: { 
    width: 60, 
    height: 60, 
    borderRadius: 6
  },
  deleteButton: { 
    position: 'absolute', 
    top: -6, 
    right: -6, 
    backgroundColor: 'red', 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  deleteText: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 14 
  },
  timeInfo: { 
    fontSize: 9, 
    color: '#666', 
    textAlign: 'center',
    marginTop: 2
  },
  dragHint: {
    fontSize: 8,
    color: '#007bff',
    marginTop: 2,
    fontWeight: 'bold'
  },
  controls: { 
    flex: 1 
  },
  mainButton: { 
    backgroundColor: '#007bff', 
    padding: 16, 
    borderRadius: 10, 
    marginBottom: 20 
  },
  // ✅ NEW STYLES FOR ASSIGNMENT FILES
  filesInfo: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107'
  },
  filesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#856404'
  },
  fileItem: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginVertical: 12, 
    color: '#495057' 
  },
  overlayButtons: { 
    flexDirection: 'row', 
    marginBottom: 15,
    justifyContent: 'space-around'
  },
  overlayOption: { 
    backgroundColor: '#28a745', 
    padding: 15, 
    borderRadius: 10, 
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  overlayOptionText: { 
    color: 'white',
    fontWeight: '600',
    fontSize: 14
  },
  statsContainer: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center'
  },
  statsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0056b3',
    marginBottom: 5
  },
  statsHint: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center'
  },
  submitButton: { 
    backgroundColor: '#dc3545', 
    padding: 18, 
    borderRadius: 10, 
    marginTop: 10 
  },
  disabledButton: { 
    backgroundColor: '#6c757d',
    opacity: 0.6
  },
  downloadButton: {
    backgroundColor: '#20c997',
    padding: 15,
    borderRadius: 10,
    marginTop: 10
  },
  downloadText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16
  },
  buttonText: { 
    color: 'white', 
    textAlign: 'center', 
    fontWeight: '600',
    fontSize: 16 
  },
  loadingContainer: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  loadingText: { 
    color: 'white', 
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600'
  },
  loadingSubtext: {
    color: '#ccc',
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 4
  },
  progressText: {
    color: 'white',
    marginTop: 8,
    fontSize: 14
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    backgroundColor: 'white', 
    padding: 25, 
    borderRadius: 15, 
    width: '90%',
    maxWidth: 400
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50'
  },
  textInput: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 20,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  imagePreview: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dee2e6'
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 10
  },
  imageInfo: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center'
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
    flex: 1
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    width: 80,
    textAlign: 'center',
    fontSize: 16
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 25 
  },
  cancelButton: { 
    padding: 12, 
    backgroundColor: '#6c757d', 
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  },
  saveButton: { 
    padding: 12, 
    backgroundColor: '#007bff', 
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center'
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  }
});
