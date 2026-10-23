import express from 'express';
import Favorite from '../models/Favorite.js';

const router = express.Router();
// Initialize a separate session for each visitor
router.use((req, res, next) => {
  if (!req.session) {
    return res.status(500).json({
      success: false,
      message: 'Session is not configured'
    });
  }

  if (!req.session.visitorInitialized) {
    req.session.visitorInitialized = true;
  }

  next();
});

// GET: Fetch all favorite countries
router.get('/', async (req, res) => {
  try {
    const favorites = await Favorite.find({
  ownerId: req.sessionID
}).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: favorites.length,
      favorites
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch favorites'
    });
  }
});

// POST: Add a favorite country
router.post('/', async (req, res) => {
  try {
    const { countryCode, countryName, flag, region, capital } = req.body;

    if (
      typeof countryCode !== 'string' ||
      !countryCode.trim() ||
      typeof countryName !== 'string' ||
      !countryName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Country code and name are required'
      });
    }
        if (countryName.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Country name must not exceed 120 characters'
      });
    }
      const optionalFields = [
  ['flag', flag, 500],
  ['region', region, 100],
  ['capital', capital, 120]
];

    for (const [field, value, maxLength] of optionalFields) {
      if (
        value !== undefined &&
        (typeof value !== 'string' || value.length > maxLength)
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string with at most ${maxLength} characters`
        });
      }
    }

    const normalizedCode = countryCode.trim().toUpperCase();

    if (!/^[A-Z]{2,3}$/.test(normalizedCode)) {
  return res.status(400).json({
    success: false,
    message: 'Country code must contain 2 or 3 letters'
  });
}

    const existingFavorite = await Favorite.findOne({
  ownerId: req.sessionID,
  countryCode: normalizedCode
});

  if (existingFavorite) {
  return res.status(200).json({
    success: true,
    message: 'Country already exists in favorites',
    favorite: existingFavorite
  });
}

    const favorite = await Favorite.create({
      ownerId: req.sessionID,
      countryCode: normalizedCode,
      countryName: countryName.trim(),
      flag: typeof flag === 'string' ? flag : '',
      region: typeof region === 'string' ? region : '',
      capital: typeof capital === 'string' ? capital : ''
    });

    res.status(201).json({
      success: true,
      message: 'Country added to favorites',
      favorite
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    if (error.name === 'ValidationError' || error.name === 'CastError') {
  return res.status(400).json({
    success: false,
    message: 'Invalid favorite country data'
  });
}

    if (error.code === 11000) {
  try {
    const existingFavorite = await Favorite.findOne({
      ownerId: req.sessionID,
      countryCode: req.body.countryCode.trim().toUpperCase()
    });

    if (existingFavorite) {
      return res.status(200).json({
        success: true,
        message: 'Country already exists in favorites',
        favorite: existingFavorite
      });
    }
  } catch (lookupError) {
    console.error('Error checking duplicate favorite:', lookupError);
  }
}

    res.status(500).json({
      success: false,
      message: 'Unable to add favorite'
    });
  }
});

// DELETE: Remove a favorite country
router.delete('/:countryCode', async (req, res) => {
  try {
    const countryCode = req.params.countryCode.trim().toUpperCase();

    await Favorite.findOneAndDelete({
      ownerId: req.sessionID,
      countryCode
    });

    return res.status(200).json({
      success: true,
      message: 'Country removed from favorites'
    });
  } catch (error) {
    console.error('Error removing favorite:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to remove favorite'
    });
  }
});

export default router;
