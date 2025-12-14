import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Create order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.userId;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    // Calculate total and check stock
    let total = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const sweet = await prisma.sweet.findUnique({
        where: { id: item.sweetId }
      });

      if (!sweet) {
        return res.status(404).json({ error: `Sweet with id ${item.sweetId} not found` });
      }

      if (sweet.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${sweet.name}` });
      }

      total += sweet.price * item.quantity;
      orderItems.push({
        sweetId: item.sweetId,
        quantity: item.quantity,
        price: sweet.price
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        total,
        status: 'PENDING',
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            sweet: true
          }
        }
      }
    });

    // Update stock
    for (const item of items) {
      await prisma.sweet.update({
        where: { id: item.sweetId },
        data: {
          quantity: {
            decrement: item.quantity
          }
        }
      });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            sweet: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
