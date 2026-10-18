/*
 * Own Chickens site configuration. This is the ONE place to plug in
 * third-party services. MailerLite and GoatCounter are configured; the
 * rest is blank and the site works normally while it is blank. See README.md "Configuration".
 */
window.OWN_CHICKENS_CONFIG = {
  signup: {
    // Email provider: MailerLite. script.js loads MailerLite's universal
    // script and swaps each signup box's built-in form for the embedded form
    // below. If that script is blocked or fails, the built-in fallback form
    // stays visible and points people to the printable checklist.
    // Set provider to "" to go back to the "coming soon" placeholder.
    provider: "mailerlite",
    mailerlite: {
      accountId: "2722517",
      formId: "8qmT6L",
      scriptSrc: "https://assets.mailerlite.com/js/universal.js",
    },
    // Seconds to wait for the embedded form to appear before showing the fallback.
    fallbackAfterSeconds: 8,
    // Legacy plain-HTML-form mode (Buttondown, Kit, ...), used only when
    // provider is "" and actionUrl is set. Otherwise forms show "coming soon".
    actionUrl: "",
    emailFieldName: "email",
    sourceFieldName: "",
    openInNewTab: true,
  },

  affiliates: {
    // TODO(Amazon Associates): add your Associates tracking ID, e.g. "ownchickens-20".
    // While empty, Amazon links are plain search links with no tracking.
    amazonTag: "",
  },

  analytics: {
    // GoatCounter (privacy-friendly, no cookies) is added directly to the
    // <head> of every page (see tools/sync_layout.py), so nothing is needed
    // here. Leave provider empty to avoid counting visits twice. This loader
    // remains for trying another provider instead (remove the GoatCounter
    // tag first):
    //   Plausible:   provider "plausible",   scriptSrc "https://plausible.io/js/script.js"
    //   Cloudflare Web Analytics: provider "cloudflare",
    //                scriptSrc "https://static.cloudflareinsights.com/beacon.min.js",
    //                cloudflareToken "YOUR_TOKEN"
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
