const fs = require('fs');
const path = require('path');

// Base directory for images
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const PLACEHOLDER = path.join(IMAGES_DIR, 'placeholder-chart.png');

// List of PNG filenames referenced in studyContent.js that currently do not exist
const missingImages = [
  'SwingPoints.png',
  'SwingStops.png',
  'FVG_Description.png',
  'Bullish_FVG.png',
  'Bearish_FVG_1.png',
  'FVGTrasnition1.png',
  'Bullish_FVG_Retrace.png',
  'Fair_Value_Gap_Inversion.png',
  'FVGDisp.png',
  'OrderBlock_InstitutionalSetup.png',
  'OrderBlock_BullishFormation.png',
  'OrderBlock_ProbabilityComparison.png',
  'OrderBlock_HighProbability.png',
  'OrderBlock_BOSSequence.png',
  'FVGManipulation1.png',
  'FVGManipulation2.png',
  'OTE_Chart1.png',
  'EqualH&L.png',
  'OldH&L.png',
  'OTE_Long.png',
  'OTE_Short.png',
  'SwingHigh.png',
  'SwingLow.png',
  'InstitutionalLiquidity.png',
  'DiscountPremiumLong.png',
  'PositionSizing.png',
  'VolumeSpike.png',
];

// Ensure placeholder exists
if (!fs.existsSync(PLACEHOLDER)) {
  console.error('Placeholder image not found at:', PLACEHOLDER);
  process.exit(1);
}

missingImages.forEach((fileName) => {
  const targetPath = path.join(IMAGES_DIR, fileName);

  // Skip if the image already exists
  if (fs.existsSync(targetPath)) {
    console.log(`[skip] ${fileName} already present.`);
    return;
  }

  // Copy placeholder to the new filename
  fs.copyFileSync(PLACEHOLDER, targetPath);
  console.log(`[copy] Created placeholder for ${fileName}`);
});

console.log('✅ Placeholder image generation complete.'); 