import mongoose from 'mongoose';
import Favorite from '../models/Favorite.js';

export async function connectDatabase(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB');

  // Ensure the compound unique index exists.
  await Favorite.createIndexes();

  // Remove the legacy globally unique countryCode index, if present.
  const indexes = await Favorite.collection.indexes();

  const legacyIndex = indexes.find(
    (index) =>
      index.name === 'countryCode_1' &&
      index.unique === true &&
      index.key?.countryCode === 1 &&
      Object.keys(index.key).length === 1
  );

  if (legacyIndex) {
    await Favorite.collection.dropIndex('countryCode_1');
    console.log('Removed legacy countryCode_1 unique index');
  }

  // Remove the redundant ownerId index if it exists.
  const redundantOwnerIndex = indexes.find(
    (index) =>
      index.name === 'ownerId_1' &&
      index.key?.ownerId === 1 &&
      Object.keys(index.key).length === 1
  );

  if (redundantOwnerIndex) {
    await Favorite.collection.dropIndex('ownerId_1');
    console.log('Removed redundant ownerId_1 index');
  }

  console.log('Favorite indexes verified');
}
