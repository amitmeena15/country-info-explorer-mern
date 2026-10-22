import express from 'express';
import Favorite from '../models/Favorite.js';

const router = express.Router();

// GET: Fetch all favorite countries
router.get('/', async (_req, res) => {
  try {
    const favorites = await Favorite.find().sort({ createdAt: -1 });

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

    const normalizedCode = countryCode.trim().toUpperCase();

    const existingFavorite = await Favorite.findOne({
      countryCode: normalizedCode
    });

    if (existingFavorite) {
      return res.status(409).json({
        success: false,
        message: 'Country already exists in favorites'
      });
    }

    const favorite = await Favorite.create({
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

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Country already exists in favorites'
      });
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

    const favorite = await Favorite.findOneAndDelete({
      countryCode
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite country not found'
      });
    }

    res.json({
      success: true,
      message: 'Country removed from favorites'
    });
  } catch (error) {
    console.error('Error removing favorite:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to remove favorite'
    });
  }
});

export default router;