/**
 * Example usage of the Profiles API namespace
 * 
 * This file demonstrates how to use the profiles API client
 * in the HostSpace Enterprise-Grade Form System.
 */

import { api } from '@/lib/api';
import type { Profile } from '@/shared/schema';

// ---------------------------------------------------------------------------
// Example 1: List profiles
// ---------------------------------------------------------------------------
async function listCommunityProfiles() {
  const profiles = await api.profiles.list({
    entityType: 'community',
    city: 'Sydney',
    pageSize: 20,
  });
  
  console.log(`Found ${profiles.length} community profiles in Sydney`);
  return profiles;
}

// ---------------------------------------------------------------------------
// Example 2: Create a new profile
// ---------------------------------------------------------------------------
async function createVenueProfile() {
  const newProfile = await api.profiles.create({
    entityType: 'venue',
    name: 'Sydney Opera House',
    handle: 'sydney-opera-house',
    email: 'info@sydneyoperahouse.com',
    phone: '+61292507111',
  });
  
  console.log(`Created profile: ${newProfile.id}`);
  return newProfile;
}

// ---------------------------------------------------------------------------
// Example 3: Auto-save draft
// ---------------------------------------------------------------------------
async function autoSaveDraft(profileId: string, formData: Partial<Profile>) {
  const result = await api.profiles.saveDraft(profileId, {
    formData,
    currentStep: 2,
    completedSteps: [1],
    entityType: 'community',
  });
  
  console.log(`Draft saved at: ${result.savedAt}`);
  return result;
}

// ---------------------------------------------------------------------------
// Example 4: Recover drafts
// ---------------------------------------------------------------------------
async function recoverDrafts() {
  const drafts = await api.profiles.getDrafts({
    entityType: 'community',
  });
  
  if (drafts.length > 0) {
    console.log(`Found ${drafts.length} draft(s)`);
    const latestDraft = drafts[0];
    console.log(`Latest draft: ${latestDraft.id}, step ${latestDraft.currentStep}`);
    return latestDraft;
  }
  
  return null;
}

// ---------------------------------------------------------------------------
// Example 5: Real-time handle validation
// ---------------------------------------------------------------------------
async function checkHandleAvailability(handle: string) {
  const result = await api.profiles.handleAvailable(handle);
  
  if (result.available) {
    console.log(`Handle "${handle}" is available`);
  } else {
    console.log(`Handle "${handle}" is taken: ${result.reason}`);
  }
  
  return result.available;
}

// ---------------------------------------------------------------------------
// Example 6: ABN validation
// ---------------------------------------------------------------------------
async function validateABN(abn: string) {
  const result = await api.profiles.abnLookup(abn);
  
  if (result.ok && result.validated) {
    console.log(`ABN ${abn} is valid`);
    console.log(`Entity name: ${result.entityName}`);
  } else {
    console.log(`ABN validation failed: ${result.message || result.error}`);
  }
  
  return result;
}

// ---------------------------------------------------------------------------
// Example 7: Version history and rollback
// ---------------------------------------------------------------------------
async function viewVersionHistory(profileId: string) {
  const versions = await api.profiles.getVersions(profileId, { limit: 10 });
  
  console.log(`Profile has ${versions.length} versions`);
  
  versions.forEach((version) => {
    console.log(`Version ${version.versionNumber}: ${version.changedFields.join(', ')}`);
  });
  
  return versions;
}

async function rollbackToVersion(profileId: string, versionNumber: number) {
  const result = await api.profiles.rollback(profileId, versionNumber);
  
  console.log(`Rolled back to version ${versionNumber}`);
  console.log(`New version number: ${result.newVersionNumber}`);
  
  return result;
}

// ---------------------------------------------------------------------------
// Example 8: Analytics
// ---------------------------------------------------------------------------
async function getProfileAnalytics(profileId: string) {
  const analytics = await api.profiles.getAnalytics(profileId, {
    period: 'weekly',
  });
  
  console.log(`Profile views: ${analytics.metrics.views}`);
  console.log(`Unique visitors: ${analytics.metrics.uniqueVisitors}`);
  console.log(`Engagement score: ${analytics.engagementScore}`);
  
  return analytics;
}

// ---------------------------------------------------------------------------
// Example 9: Publish profile
// ---------------------------------------------------------------------------
async function publishProfile(profileId: string) {
  const result = await api.profiles.publish(profileId);
  
  if (result.verificationRequired) {
    console.log(`Profile submitted for verification`);
    console.log(`Estimated review time: ${result.estimatedReviewTime}`);
  } else {
    console.log(`Profile published successfully`);
  }
  
  return result;
}

// ---------------------------------------------------------------------------
// Example 10: Complete workflow
// ---------------------------------------------------------------------------
async function completeProfileCreationWorkflow() {
  // Step 1: Check handle availability
  const handleAvailable = await checkHandleAvailability('my-community');
  if (!handleAvailable) {
    throw new Error('Handle not available');
  }
  
  // Step 2: Create profile
  const profile = await api.profiles.create({
    entityType: 'community',
    name: 'My Community',
    handle: 'my-community',
    email: 'contact@mycommunity.com',
    phone: '+61400000000',
  });
  
  // Step 3: Auto-save as user fills form
  await autoSaveDraft(profile.id, {
    description: 'We are a diverse community...',
  });
  
  // Step 4: Validate ABN (if business)
  // await validateABN('12345678901');
  
  // Step 5: Publish
  const publishResult = await publishProfile(profile.id);
  
  // Step 6: View analytics after publish
  if (publishResult.status === 'published') {
    setTimeout(async () => {
      await getProfileAnalytics(profile.id);
    }, 1000);
  }
  
  return profile;
}

// Export examples for documentation
export {
  listCommunityProfiles,
  createVenueProfile,
  autoSaveDraft,
  recoverDrafts,
  checkHandleAvailability,
  validateABN,
  viewVersionHistory,
  rollbackToVersion,
  getProfileAnalytics,
  publishProfile,
  completeProfileCreationWorkflow,
};
