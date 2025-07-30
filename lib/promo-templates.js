// Promo code template registry - these are NOT valid codes themselves
// They are only used as templates for generating actual promo codes

const PROMO_TEMPLATES = {
  TESTFREE: {
    name: 'Test Free Access Template',
    discountType: 'free_access',
    discountValue: 0,
    finalPrice: 0,
    description: 'Template for generating test codes with free access',
    warning: 'This is a TEMPLATE only - do not use directly!'
  },
  BETA50: {
    name: 'Beta 50% Off Template',
    discountType: 'percentage',
    discountValue: 50,
    description: 'Template for beta testing codes with 50% discount',
    warning: 'This is a TEMPLATE only - do not use directly!'
  },
  PARTNER25: {
    name: 'Partner 25% Off Template',
    discountType: 'percentage',
    discountValue: 25,
    description: 'Template for partner codes with 25% discount',
    warning: 'This is a TEMPLATE only - do not use directly!'
  }
};

// List of template names that should NEVER be accepted as valid codes
const TEMPLATE_NAMES = Object.keys(PROMO_TEMPLATES);

// Check if a code is a template name
function isTemplateCode(code) {
  if (!code || typeof code !== 'string') return false;
  return TEMPLATE_NAMES.includes(code.toUpperCase());
}

// Get template details
function getTemplate(templateName) {
  return PROMO_TEMPLATES[templateName.toUpperCase()] || null;
}

module.exports = {
  PROMO_TEMPLATES,
  TEMPLATE_NAMES,
  isTemplateCode,
  getTemplate
};