import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform, ScrollView } from 'react-native';
import { router, Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import type { SkiLevel, TerrainPreference, SpeedPreference } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const TERRAIN_OPTIONS: TerrainPreference[] = ['groomed', 'moguls', 'backcountry', 'park'];
const SKILL_LEVELS: SkiLevel[] = ['green', 'blue', 'black', 'double black'];
const SPEED_PREFERENCES: SpeedPreference[] = ['relaxed', 'moderate', 'fast'];
const GENDER_OPTIONS = ['male', 'female', 'other'];
const MAX_PHOTOS = 6;

function convertBirthday(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    let [month, day, year] = parts;
    month = month.padStart(2, '0');
    day = day.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    name: '',
    birthday: '',
    gender: '',
    location: '',
    years_skiing: '',
    preferred_terrain: [] as TerrainPreference[],
    skill_level: '' as SkiLevel,
    speed_preference: '' as SpeedPreference,
    photos: [] as string[],
  });

  const pickImage = async () => {
    if (profile.photos.length >= MAX_PHOTOS) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7, // Reduce quality to reduce image size
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0];
      setProfile(prev => ({
        ...prev,
        photos: [...prev.photos, selectedImage.uri]
      }));
    }
  };

  const uploadImage = async (imageUri: string, userId: string) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const imageName = `${uuidv4()}.jpg`;
      const imagePath = `${userId}/${imageName}`;

      const { data, error } = await supabase.storage
        .from('profile_photos')
        .upload(imagePath, blob, {
          contentType: 'image/jpeg',
        });

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      const publicUrl = `https://your-supabase-url.supabase.co/storage/v1/object/public/profile_photos/${imagePath}`; // Replace with your Supabase URL
      return publicUrl;
    } catch (error) {
      console.error('Error creating blob or uploading image:', error);
      return null;
    }
  };

  const removePhoto = (index: number) => {
    setProfile(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  async function handleComplete() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.replace('/(auth)/sign-in');
      return;
    }

    try {
      const convertedBirthday = convertBirthday(profile.birthday);
      const uploadedPhotoUrls = [];

      for (const photo of profile.photos) {
        const uploadedUrl = await uploadImage(photo, user.id);
        if (uploadedUrl) {
          uploadedPhotoUrls.push(uploadedUrl);
        } else {
          // Handle the error appropriately, maybe show a message to the user
          console.error('Failed to upload one of the images.');
          return; // Stop if any image fails to upload
        }
      }

      const { error } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email: user.email,
            name: profile.name,
            birthday: convertedBirthday,
            gender: profile.gender,
            location: profile.location,
            years_skiing: parseInt(profile.years_skiing, 10),
            preferred_terrain: profile.preferred_terrain,
            skill_level: profile.skill_level,
            speed_preference: profile.speed_preference,
            photo_url: uploadedPhotoUrls[0] || null, // Use the first uploaded image as main photo
            photo_urls: uploadedPhotoUrls,
          },
        ]);

      if (error) throw error;

      router.replace('/(tabs)');
      
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }

  function renderStep() {
    const commonInputStyle = [styles.input, { textAlign: 'center' }];
    const commonContainerStyle = [styles.stepContainer, { alignItems: 'center' }];

    switch (step) {
      case 1:
        return (
          <View style={commonContainerStyle}>
            <Text style={styles.stepTitle}>What's your first name?</Text>
            <TextInput
              style={commonInputStyle}
              placeholder="Enter your first name"
              value={profile.name}
              onChangeText={(value) => setProfile({ ...profile, name: value })}
            />
          </View>
        );

      case 2:
        return (
          <View style={commonContainerStyle}>
            <Text style={styles.stepTitle}>When's your birthday?</Text>
            <TextInput
              style={commonInputStyle}
              placeholder="MM/DD/YYYY"
              value={profile.birthday}
              onChangeText={(value) => setProfile({ ...profile, birthday: value })}
            />
          </View>
        );

      case 3:
        return (
          <View style={commonContainerStyle}>
            <Text style={styles.stepTitle}>What's your gender?</Text>
            {GENDER_OPTIONS.map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.optionButton,
                  profile.gender === gender && styles.optionSelected,
                ]}
                onPress={() => setProfile({ ...profile, gender })}
              >
                <Text
                  style={[
                    styles.optionText,
                    profile.gender === gender && styles.optionTextSelected,
                  ]}
                >
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 4:
        return (
          <View style={commonContainerStyle}>
            <Text style={styles.stepTitle}>Where do you usually ski?</Text>
            <TextInput
              style={commonInputStyle}
              placeholder="Enter your usual location"
              value={profile.location}
              onChangeText={(value) => setProfile({ ...profile, location: value })}
            />
            <TextInput
              style={commonInputStyle}
              placeholder="Years of experience"
              value={profile.years_skiing}
              onChangeText={(value) => setProfile({ ...profile, years_skiing: value })}
              keyboardType="number-pad"
            />
          </View>
        );

      case 5:
        return (
          <View style={commonContainerStyle}>
            <Text style={styles.stepTitle}>What's your style?</Text>
            <Text style={styles.stepDescription}>Select your preferences:</Text>
            
            <Text style={styles.subheading}>Preferred Terrain</Text>
            {TERRAIN_OPTIONS.map((terrain) => (
              <TouchableOpacity
                key={terrain}
                style={[
                  styles.optionButton,
                  profile.preferred_terrain.includes(terrain) && styles.optionSelected,
                ]}
                onPress={() => {
                  const newTerrain = profile.preferred_terrain.includes(terrain)
                    ? profile.preferred_terrain.filter((t) => t !== terrain)
                    : [...profile.preferred_terrain, terrain];
                  setProfile({ ...profile, preferred_terrain: newTerrain });
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    profile.preferred_terrain.includes(terrain) && styles.optionTextSelected,
                  ]}
                >
                  {terrain.charAt(0).toUpperCase() + terrain.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.subheading}>Skill Level</Text>
            {SKILL_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionButton,
                  profile.skill_level === level && styles.optionSelected,
                ]}
                onPress={() => setProfile({ ...profile, skill_level: level })}
              >
                <Text
                  style={[
                    styles.optionText,
                    profile.skill_level === level && styles.optionTextSelected,
                  ]}
                >
                  {level.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.subheading}>Speed Preference</Text>
            {SPEED_PREFERENCES.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.optionButton,
                  profile.speed_preference === speed && styles.optionSelected,
                ]}
                onPress={() => setProfile({ ...profile, speed_preference: speed })}
              >
                <Text
                  style={[
                    styles.optionText,
                    profile.speed_preference === speed && styles.optionTextSelected,
                  ]}
                >
                  {speed.charAt(0).toUpperCase() + speed.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 6:
        return (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={commonContainerStyle}>
              <Text style={styles.stepTitle}>Add your photos</Text>
              <Text style={styles.stepDescription}>Add up to 6 of your best ski photos!</Text>
              
              <View style={styles.photoGrid}>
                {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
                  const photo = profile.photos[index];
                  
                  return (
                    <View key={index} style={styles.photoContainer}>
                      {photo ? (
                        <>
                          <Image
                            source={{ uri: photo }}
                            style={styles.photoPreview}
                          />
                          <TouchableOpacity
                            style={styles.removePhotoButton}
                            onPress={() => removePhoto(index)}
                          >
                            <X size={20} color="#fff" />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          style={styles.addPhotoButton}
                          onPress={pickImage}
                          disabled={profile.photos.length >= MAX_PHOTOS}
                        >
                          <Camera size={32} color="#666" />
                          <Text style={styles.addPhotoText}>
                            {index === 0 ? 'Add main photo' : 'Add photo'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        );

      case 7:
        return (
          <View style={commonContainerStyle}>
            <Text style={styles.stepTitle}>Welcome to SkiBuddy!</Text>
            <Text style={styles.stepDescription}>
              You're all set to find your perfect ski buddy. Start exploring matches now!
            </Text>
          </View>
        );

      default:
        return null;
    }
  }

  function canProceed() {
    switch (step) {
      case 1:
        return profile.name.length > 0;
      case 2:
        return profile.birthday.length > 0;
      case 3:
        return profile.gender;
      case 4:
        return profile.location && profile.years_skiing;
      case 5:
        return (
          profile.preferred_terrain.length > 0 &&
          profile.skill_level &&
          profile.speed_preference
        );
      case 6:
        return profile.photos.length > 0;
      case 7:
        return true;
      default:
        return false;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.progress}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View
            key={i + 1}
            style={[
              styles.progressDot,
              i + 1 === step && styles.progressDotActive,
              i + 1 < step && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      {renderStep()}

      <View style={styles.buttonContainer}>
        {step > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setStep(step - 1)}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            !canProceed() && styles.buttonDisabled,
            step > 1 && { flex: 1, marginLeft: 10 },
          ]}
          onPress={() => {
            if (step < 7) {
              setStep(step + 1);
            } else {
              handleComplete();
            }
          }}
          disabled={!canProceed()}
        >
          <Text style={styles.buttonText}>
            {step === 7 ? 'Start Exploring' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#2563eb',
    transform: [{ scale: 1.2 }],
  },
  progressDotCompleted: {
    backgroundColor: '#2563eb',
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    width: '100%',
    maxWidth: 300,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
    maxWidth: 300,
  },
  optionSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#fff',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 600,
  },
  photoContainer: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  addPhotoButton: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#2563eb',
  },
});
