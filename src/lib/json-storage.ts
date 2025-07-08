// Système de persistance avec fichiers JSON
// Remplace temporairement la base de données en attendant que Prisma fonctionne

import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ENTITIES_FILE = path.join(DATA_DIR, 'entities.json');
const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');

// Assurer que le répertoire data existe
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    console.log('📁 Répertoire data créé');
  }
}

// Fonctions de lecture
export async function readEntitiesFromFile(): Promise<any[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(ENTITIES_FILE, 'utf-8');
    const entities = JSON.parse(data);
    console.log('📖 Entités lues depuis le fichier:', entities.length);
    return entities;
  } catch (error) {
    console.log('📖 Aucun fichier d\'entités, retour tableau vide');
    return [];
  }
}

export async function readAssetsFromFile(): Promise<any[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(ASSETS_FILE, 'utf-8');
    const assets = JSON.parse(data);
    console.log('📖 Actifs lus depuis le fichier:', assets.length);
    return assets;
  } catch (error) {
    console.log('📖 Aucun fichier d\'actifs, retour tableau vide');
    return [];
  }
}

// Fonctions d'écriture
export async function writeEntitiesToFile(entities: any[]): Promise<void> {
  try {
    await ensureDataDir();
    await fs.writeFile(ENTITIES_FILE, JSON.stringify(entities, null, 2));
    console.log('💾 Entités sauvegardées dans le fichier:', entities.length);
  } catch (error) {
    console.error('❌ Erreur sauvegarde entités:', error);
    throw error;
  }
}

export async function writeAssetsToFile(assets: any[]): Promise<void> {
  try {
    await ensureDataDir();
    await fs.writeFile(ASSETS_FILE, JSON.stringify(assets, null, 2));
    console.log('💾 Actifs sauvegardés dans le fichier:', assets.length);
  } catch (error) {
    console.error('❌ Erreur sauvegarde actifs:', error);
    throw error;
  }
}

// Fonctions d'ajout
export async function addEntityToFile(entity: any): Promise<void> {
  const entities = await readEntitiesFromFile();
  entities.push(entity);
  await writeEntitiesToFile(entities);
  console.log('➕ Entité ajoutée au fichier:', entity.name);
}

export async function addAssetToFile(asset: any): Promise<void> {
  const assets = await readAssetsFromFile();
  assets.push(asset);
  await writeAssetsToFile(assets);
  console.log('➕ Actif ajouté au fichier:', asset.name);
}

// Fonctions de récupération par utilisateur
export async function getEntitiesByUserId(userId: string): Promise<any[]> {
  const entities = await readEntitiesFromFile();
  return entities.filter(entity => entity.userId === userId);
}

export async function getAssetsByUserId(userId: string): Promise<any[]> {
  const assets = await readAssetsFromFile();
  return assets.filter(asset => 
    asset.ownerships?.some((ownership: any) => 
      ownership.ownerEntity?.userId === userId
    )
  );
} 