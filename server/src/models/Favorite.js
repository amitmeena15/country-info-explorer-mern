import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String,
      required: true
    },

    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{3}$/
    },

    countryName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    flag: {
      type: String,
      default: '',
      maxlength: 500
    },

    region: {
      type: String,
      default: '',
      maxlength: 100
    },

    capital: {
      type: String,
      default: '',
      maxlength: 120
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
// Hide internal visitor identifier from API responses.
favoriteSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.ownerId;
    return ret;
  }
});

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;
