import { render } from 'preact';
import './styles.css';

function Mark() {
  return <svg className="mark" viewBox="0 0 48 48" aria-hidden="true"><path className="mark__paper" d="M6 4h36v40H6z" /><path className="mark__rule" d="M13 14h22M13 21h22M13 28h13" /><path className="mark__pencil" d="m25 38 12-12 5 5-12 12-7 2z" /></svg>;
}

function LegalLayout({ children }: { children: preact.ComponentChildren }) {
  return <><header className="legal-header"><a className="brand" href="/"><Mark /><span>Rubric Feedback Bundles</span></a></header><main id="main" className="legal-main">{children}</main><footer className="site-footer"><p>Built for private, human feedback.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav></footer></>;
}

function Privacy() {
  return <LegalLayout><p className="eyebrow">Plain-language policy</p><h1>Privacy</h1><p className="updated">Effective 28 August 2026</p>
    <p>Rubric Feedback Bundles is local-first. Student names, submissions, rubric fragments, notes, and feedback records are stored in your browser’s IndexedDB. They are not sent to us, an AI model, or an analytics service.</p>
    <h2>What stays on your device</h2><p>Your bundles and student work remain on the device and browser profile where you created them. We cannot see, recover, or synchronize that classroom data. If you clear site storage, it may be lost, so use the JSON backup in Settings.</p>
    <h2>Exports are your choice</h2><p>Feedback pages, CSV summaries, and JSON backups are created in your browser. A file leaves the app only when you explicitly download or share it. JSON backups contain identifiable student data; store them according to your school’s policies.</p>
    <h2>License checks</h2><p>If you buy or restore Plus, the license token is stored in localStorage and sent to the Sociobot billing API only to verify access. The API may receive routine connection data such as IP address and user agent. Checkout is hosted by Sociobot/Dodo, the merchant of record, under their applicable privacy terms. Student data is never included in a license check.</p>
    <h2>Offline cache</h2><p>The service worker stores application files, fonts, and the product illustration so the tool can work offline. It does not cache your exports or send activity logs.</p>
    <h2>Analytics and cookies</h2><p>This version includes no analytics, advertising pixels, third-party scripts, cookies, or page-view tracking.</p>
    <h2>Your choices</h2><ul><li>Export a JSON backup at any time from Settings.</li><li>Delete a bundle from the Bundles page.</li><li>Remove all local data by clearing this site’s storage in your browser.</li><li>Use the complete free workflow without creating an account.</li></ul>
    <h2>Questions</h2><p>Privacy questions can be sent to <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>. Do not include student work in your message.</p>
  </LegalLayout>;
}

function Terms() {
  return <LegalLayout><p className="eyebrow">Terms of use</p><h1>Terms</h1><p className="updated">Effective 28 August 2026</p>
    <p>Rubric Feedback Bundles helps teachers assemble and export feedback. By using it, you agree to these terms.</p>
    <h2>Your responsibility</h2><p>You are responsible for the student information you enter, the feedback you provide, and compliance with your school’s policies and applicable education and privacy laws. Use appropriate devices and protect exported files. The tool does not make grading decisions.</p>
    <h2>Free edition</h2><p>The free edition supports one complete feedback bundle, reusable and editable fragments, personal notes, student feedback-page export, anonymized on-screen class patterns, and JSON backup/import. Core accessibility, privacy, and data export are never paywalled.</p>
    <h2>Plus license</h2><p>Plus costs <strong>$24 as a one-time purchase</strong> and unlocks unlimited saved bundles and CSV class summaries for the purchaser. It is not a subscription. The license may be restored on another device using the supplied token. The factory registers and operates the product through the Sociobot billing service.</p>
    <h2>Checkout and refunds</h2><p>Sociobot/Dodo is the merchant of record and handles payment and refunds. A refund revokes the associated license automatically. We do not receive or store card details in this app.</p>
    <h2>Acceptable use</h2><p>Do not use the service to violate law, infringe rights, attempt to bypass license verification, or distribute a purchased license token. You retain responsibility for and rights to the feedback and data you create.</p>
    <h2>Availability and backups</h2><p>The software is provided as available without a guarantee of uninterrupted operation. Because classroom data is local-first, you should make regular backups. We cannot restore browser data that has been cleared or lost.</p>
    <h2>Warranty and liability</h2><p>To the extent permitted by law, the software is provided without warranties. Sociobot is not liable for indirect or consequential loss, lost classroom records, or decisions made from use of the tool. Nothing here limits rights that cannot legally be limited.</p>
    <h2>Changes and contact</h2><p>Material changes will be reflected by a new effective date. Questions can be sent to <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p>
  </LegalLayout>;
}

render(document.body.dataset.legal === 'terms' ? <Terms /> : <Privacy />, document.getElementById('legal')!);
