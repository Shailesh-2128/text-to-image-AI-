const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Also get counts if needed
    const Image = require('../models/Image');
    const imageCount = await Image.countDocuments({ userId: req.userId });
    
    res.json({ ...user.toObject(), totalImages: imageCount });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/profile/update', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(req.userId, { name }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const bcrypt = require('bcryptjs');
    const user = await User.findById(req.userId);
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });
    
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/delete-account', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    const Image = require('../models/Image');
    const Chat = require('../models/Chat');
    await Image.deleteMany({ userId: req.userId });
    await Chat.deleteMany({ userId: req.userId });
    
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
