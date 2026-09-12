import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { StorageService, VaultFile } from '../services/storage.service';
import { useAppState } from '../hooks/useAppState';
import * as ScreenCapture from 'expo-screen-capture';
import { DecryptedImage } from '../components/DecryptedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type VaultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Vault'>;

interface Props {
  navigation: VaultScreenNavigationProp;
}

export const VaultScreen: React.FC<Props> = ({ navigation }) => {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  useAppState(() => {
    navigation.replace('Lock');
  });

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    loadFiles();
    return () => { ScreenCapture.allowScreenCaptureAsync(); };
  }, []);

  const loadFiles = async () => {
    const vaultFiles = await StorageService.getFiles();
    setFiles(vaultFiles);
  };

  const importImageOrVideo = async () => {
    setShowMenu(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const type = asset.type === 'video' ? 'video' : 'image';
        await StorageService.saveFile(
          asset.uri, 
          asset.fileName || 'Recurso Multimedia', 
          type, 
          asset.mimeType, 
          asset.fileSize
        );
        loadFiles();
      }
    } catch (error: any) {
      Alert.alert("Error guardando multimedia", error?.message || String(error));
      console.error(error);
    }
  };

  const importDocument = async () => {
    setShowMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: false, // Se cambia a false para leer directamente el URI original (content://) sin fallos de caché.
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await StorageService.saveFile(
          asset.uri,
          asset.name,
          'document',
          asset.mimeType,
          asset.size
        );
        loadFiles();
      }
    } catch (error: any) {
      Alert.alert("Error guardando documento", error?.message || String(error));
      console.error(error);
    }
  };

  const confirmDelete = (item: VaultFile) => {
    Alert.alert(
      "Eliminar Archivo",
      `¿Eliminar "${item.name}" permanentemente de la bóveda?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await StorageService.deleteFile(item.uri);
              loadFiles();
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar el archivo.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: VaultFile }) => (
    <TouchableOpacity 
      style={styles.card} 
      onLongPress={() => confirmDelete(item)}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        {item.type === 'image' ? (
          <DecryptedImage encryptedUri={item.uri} style={styles.thumbnail} />
        ) : (
          <LinearGradient colors={['#3b82f6', '#8b5cf6']} style={styles.placeholderThumbnail}>
            <Ionicons name={item.type === 'video' ? 'videocam' : 'document-text'} size={32} color="#fff" />
          </LinearGradient>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>{item.type.toUpperCase()}</Text>
      </View>
      <Ionicons name="trash-outline" size={24} color="#ef4444" onPress={() => confirmDelete(item)} style={{ padding: 10 }} />
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Bóveda</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('ChangePin')} style={[styles.lockButton, { backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.5)', marginRight: 10 }]}>
              <Ionicons name="settings" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.replace('Lock')} style={styles.lockButton}>
              <Ionicons name="lock-closed" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>La bóveda está vacía.</Text>
              <Text style={styles.emptySubtext}>Toca el botón + para añadir archivos seguros.</Text>
            </View>
          }
        />

        {/* Floating Action Button (FAB) */}
        {showMenu && (
          <View style={styles.fabMenu}>
            <TouchableOpacity style={[styles.fabMenuItem, { backgroundColor: '#3b82f6' }]} onPress={importDocument}>
              <Ionicons name="document" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fabMenuItem, { backgroundColor: '#ec4899' }]} onPress={importImageOrVideo}>
              <Ionicons name="images" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.fab, showMenu && styles.fabActive]} 
          onPress={() => setShowMenu(!showMenu)}
          activeOpacity={0.8}
        >
          <Ionicons name={showMenu ? "close" : "add"} size={32} color="#fff" />
        </TouchableOpacity>

      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: 50, paddingBottom: 20 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  lockButton: { backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 16, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  thumbnailContainer: { marginRight: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  thumbnail: { width: 64, height: 64, borderRadius: 12 },
  placeholderThumbnail: { width: 64, height: 64, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  itemSubtitle: { fontSize: 12, color: '#a5b4fc', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: Dimensions.get('window').height * 0.2 },
  emptyText: { fontSize: 18, color: '#fff', marginTop: 15, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  fabActive: { backgroundColor: '#475569', shadowColor: '#000' },
  fabMenu: { position: 'absolute', bottom: 110, right: 35, alignItems: 'center' },
  fabMenuItem: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 }
});
