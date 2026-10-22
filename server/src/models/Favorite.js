import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    countryCode: {
      type: String,
      required: true,
      unique: true,
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

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;