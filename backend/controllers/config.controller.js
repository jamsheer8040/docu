const { SystemConfig } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Storage Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/branding';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

exports.upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|svg|webp/;
    const meta = allowed.test(file.mimetype);
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (meta && ext) return cb(null, true);
    cb(new Error('Only images (jpg, png, svg, webp) are allowed.'));
  }
});

exports.getConfigs = async (req, res) => {
  try {
    // Only fetch global configs (tenant_id IS NULL)
    const configs = await SystemConfig.findAll({ where: { tenant_id: null } }) || [];
    const configMap = {};
    configs.forEach(c => {
      try {
        configMap[c.key] = JSON.parse(c.value);
      } catch (e) {
        configMap[c.key] = c.value;
      }
    });
    res.json({ success: true, data: configMap });
  } catch (err) {
    console.error('[Config Controller] Safe return on error:', err);
    res.json({ success: true, data: {} });
  }
};

exports.updateConfigs = async (req, res) => {
  try {
    const settings = req.body; 
    
    for (const [key, value] of Object.entries(settings)) {
      await SystemConfig.upsert({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        tenant_id: req.user.tenant_id
      });
    }
    
    res.json({ success: true, message: 'Configuration updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating configuration.' });
  }
};

exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const logoUrl = `/uploads/branding/${req.file.filename}`;
    
    // Auto-update config
    await SystemConfig.upsert({
      key: 'app_logo',
      value: logoUrl
    });

    res.json({ 
      success: true, 
      message: 'Logo uploaded successfully.',
      url: logoUrl
    });
  } catch (err) {
    console.error('[Config Controller] Upload Error:', err);
    res.status(500).json({ success: false, message: 'Logo upload failed.' });
  }
};
