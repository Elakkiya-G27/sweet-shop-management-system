import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Get all sweets
router.get('/', async (req, res) => {
  try {
    const sweets = await prisma.sweet.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(sweets);
  } catch (error) {
    console.error('Error fetching sweets:', error);
    res.status(500).json({ error: 'Failed to fetch sweets' });
  }
});

// Get single sweet
router.get('/:id', async (req, res) => {
  try {
    const sweet = await prisma.sweet.findUnique({
      where: { id: req.params.id }
    });

    if (!sweet) {
      return res.status(404).json({ error: 'Sweet not found' });
    }

    res.json(sweet);
  } catch (error) {
    console.error('Error fetching sweet:', error);
    res.status(500).json({ error: 'Failed to fetch sweet' });
  }
});

// Create sweet (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, description, price, quantity, category, imageUrl } = req.body;

    if (!name || !price || !quantity || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sweet = await prisma.sweet.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        category,
        imageUrl
      }
    });

    res.status(201).json(sweet);
  } catch (error) {
    console.error('Error creating sweet:', error);
    res.status(500).json({ error: 'Failed to create sweet' });
  }
});

// Update sweet (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, quantity, category, imageUrl } = req.body;

    const sweet = await prisma.sweet.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(category && { category }),
        ...(imageUrl !== undefined && { imageUrl })
      }
    });

    res.json(sweet);
  } catch (error) {
    console.error('Error updating sweet:', error);
    res.status(500).json({ error: 'Failed to update sweet' });
  }
});

// Delete sweet (admin only)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.sweet.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Sweet deleted successfully' });
  } catch (error) {
    console.error('Error deleting sweet:', error);
    res.status(500).json({ error: 'Failed to delete sweet' });
  }
});

export default router;
