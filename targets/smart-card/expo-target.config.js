/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "smart-card",
  entitlements: {
    "com.apple.security.application-groups": ["group.au.culturepass.app"]
  },
});