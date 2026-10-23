import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String,
      required: true,
      index: true
    },

    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    countryName: {
      type: String,
      required: true,
      trim: true
    },

    flag: {
      type: String,
      default: ''
    },

    region: {
      type: String,
      default: ''
    },

    capital: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Each visitor can save a country only once.
favoriteSchema.index(
  { ownerId: 1, countryCode: 1 },
  { unique: true }
);

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;