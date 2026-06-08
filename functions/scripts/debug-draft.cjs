
const { UpdateProfileDraftBodySchema } = require('../../shared/schema/hostProfileDraft.js');
const payload = {
  entityType: 'business',
  formData: { officialName: 'My Business', handle: 'my-business' },
  currentStep: 3,
  completedSteps: [1, 2],
  deviceInfo: { platform: 'web', userAgent: 'Mozilla/5.0' },
};
try {
  console.log('parse ok', JSON.stringify(UpdateProfileDraftBodySchema.parse(payload)));
} catch (e) {
  console.log('parse fail', e.constructor.name, e.message);
  if (e.issues) console.log(JSON.stringify(e.issues, null, 2));
}
