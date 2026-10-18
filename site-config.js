/*
 * Own Chickens site configuration. This is the ONE place to plug in
 * third-party services. Everything here is intentionally blank for now, and
 * the site works normally while it is blank. See README.md "Configuration".
 */
window.OWN_CHICKENS_CONFIG = {
  signup: {
    // TODO(email provider): paste the form action URL from your provider.
    //   Buttondown:  "https://buttondown.com/api/emails/embed-subscribe/YOUR_USERNAME"
    //   MailerLite:  the action URL from your embedded form's HTML
    //   Kit (ConvertKit): "https://app.kit.com/forms/YOUR_FORM_ID/subscriptions"
    // While this is empty, signup forms show a friendly "coming soon" message
    // and nothing is sent anywhere.
    actionUrl: "",
    // Name of the email field the provider expects.
    //   Buttondown: "email"   MailerLite: "fields[email]"   Kit: "email_address"
    emailFieldName: "email",
    // Optional hidden field used to tag where the signup came from
    // (for example Buttondown "tag", MailerLite groups need their own setup).
    // Leave empty to skip.
    sourceFieldName: "",
    // Open the provider's confirmation page in a new tab.
    openInNewTab: true,
  },

  affiliates: {
    // TODO(Amazon Associates): add your Associates tracking ID, e.g. "ownchickens-20".
    // While empty, Amazon links are plain search links with no tracking.
    amazonTag: "",
  },

  analytics: {
    // TODO(analytics): choose a privacy-friendly provider, then fill these in.
    //   Plausible:   provider "plausible",   scriptSrc "https://plausible.io/js/script.js"
    //   GoatCounter: provider "goatcounter", scriptSrc "https://gc.zgo.at/count.js",
    //                goatcounterEndpoint "https://YOURCODE.goatcounter.com/count"
    //   Cloudflare Web Analytics: provider "cloudflare",
    //                scriptSrc "https://static.cloudflareinsights.com/beacon.min.js",
    //                cloudflareToken "YOUR_TOKEN"
    // While provider is empty, no analytics script loads at all.
    provider: "",
    scriptSrc: "",
    domain: "ownchickens.com",
    goatcounterEndpoint: "",
    cloudflareToken: "",
  },

  corrections: {
    // "Report a correction" links open a prefilled GitHub issue by default.
    // TODO(optional): set a monitored inbox, e.g. "rules@ownchickens.com", to
    // also offer an email option on law pages.
    email: "",
    issuesUrl: "https://github.com/doodster0x/ownchickens/issues/new",
  },
};
