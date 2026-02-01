import * as MediaLibrary from 'expo-media-library';

export async function getCameraImages() {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') return [];
  const assets = await MediaLibrary.getAssetsAsync({ mediaType: 'photo', first: 20, sortBy: [['creationTime', false]] });
  // Separate front and back camera images if possible (dummy split)
  const images = assets.assets.slice(0, 10);
  return images;
}
