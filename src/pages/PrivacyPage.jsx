export default function PrivacyPage() {
  const domain = 'autograde.live'; // update to your actual domain
  const email  = 'privacy@autograde.live';
  const date   = 'June 2025';

  return (
    <LegalPage title="Privacy Policy" updated={date}>
      <Section title="1. Introduction">
        <p>AutoGrade.live ("we", "our", or "us") operates at <strong>{domain}</strong>. This Privacy Policy explains how we collect, use, and protect your information when you use our AI-powered grading platform.</p>
        <p>By using AutoGrade.live, you agree to the collection and use of information in accordance with this policy.</p>
      </Section>

      <Section title="2. Information We Collect">
        <SubSection title="2.1 Google Account Information">
          <p>When you sign in with Google, we receive your:</p>
          <ul>
            <li>Name and email address</li>
            <li>Google profile information</li>
            <li>OAuth access tokens to interact with Google Classroom and Google Drive on your behalf</li>
          </ul>
        </SubSection>
        <SubSection title="2.2 Google Classroom Data">
          <p>With your permission, we access:</p>
          <ul>
            <li>Your course list and assignments (read-only)</li>
            <li>Student submission files from Google Drive (read-only, for grading purposes)</li>
            <li>We write back only the assigned grades you choose to sync</li>
          </ul>
        </SubSection>
        <SubSection title="2.3 Grading Data">
          <p>We store AI-generated grades, scores, remarks, and feedback for each submission in our database. This data is linked to your account and the relevant assignment.</p>
        </SubSection>
        <SubSection title="2.4 Payment Information">
          <p>Payments are processed by <strong>Razorpay</strong>. We do not store your card details. We store transaction records including amount, order ID, and wallet balance for billing purposes.</p>
        </SubSection>
        <SubSection title="2.5 Usage Data">
          <p>We may collect logs of API usage, grading job activity, and error reports to improve the platform.</p>
        </SubSection>
      </Section>

      <Section title="3. How We Use Your Information">
        <ul>
          <li>To authenticate you and maintain your session</li>
          <li>To fetch your Google Classroom courses and student submissions for grading</li>
          <li>To run AI grading via Google Gemini and store results</li>
          <li>To sync grades back to Google Classroom when you choose to</li>
          <li>To manage your wallet balance and billing</li>
          <li>To send transactional emails related to your account (e.g. payment confirmations)</li>
          <li>To improve platform performance and fix bugs</li>
        </ul>
      </Section>

      <Section title="4. Data Sharing">
        <p>We do not sell your personal data. We share data only with:</p>
        <ul>
          <li><strong>Google</strong> — via their APIs for Classroom and Drive access</li>
          <li><strong>Google Gemini</strong> — student submission content is sent to Gemini AI for grading analysis</li>
          <li><strong>Razorpay</strong> — for payment processing</li>
          <li><strong>Google Cloud Storage (GCS)</strong> — for temporary file storage during grading jobs</li>
        </ul>
        <p>Student submission content sent to Gemini is used solely for generating grades and feedback. We do not use it to train AI models.</p>
      </Section>

      <Section title="5. Data Retention">
        <ul>
          <li>Grading results are retained as long as your account is active</li>
          <li>OAuth tokens are stored securely and can be revoked at any time via your Google Account settings</li>
          <li>Uploaded files in GCS are deleted after grading jobs complete</li>
          <li>Payment records are retained for 7 years for accounting compliance</li>
        </ul>
      </Section>

      <Section title="6. Google API Disclosure">
        <p>AutoGrade.ai's use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{color:'#34d399'}}>Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
        <p>Specifically:</p>
        <ul>
          <li>We only request the minimum scopes necessary</li>
          <li>We do not use Google user data for advertising</li>
          <li>We do not allow humans to read user data unless required for security, legal compliance, or explicit user request</li>
        </ul>
      </Section>

      <Section title="7. Security">
        <p>We implement industry-standard security measures including:</p>
        <ul>
          <li>HTTPS encryption for all data in transit</li>
          <li>Encrypted storage of OAuth tokens</li>
          <li>Razorpay signature verification for all payments</li>
          <li>JWT-based authentication with expiry</li>
        </ul>
      </Section>

      <Section title="8. Your Rights">
        <p>You have the right to:</p>
        <ul>
          <li>Access the data we hold about you</li>
          <li>Request deletion of your account and associated data</li>
          <li>Revoke Google OAuth access at any time via <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{color:'#34d399'}}>Google Account Permissions</a></li>
        </ul>
        <p>To exercise these rights, email us at <a href={`mailto:${email}`} style={{color:'#34d399'}}>{email}</a>.</p>
      </Section>

      <Section title="9. Children's Privacy">
        <p>AutoGrade.ai is intended for use by teachers and educational institutions. We do not knowingly collect personal data from children under 13. If you believe a child has provided us with personal information, please contact us immediately.</p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated date. Continued use of the platform after changes constitutes acceptance.</p>
      </Section>

      <Section title="11. Contact">
        <p>For privacy-related questions or data deletion requests:</p>
        <p><strong>Email:</strong> <a href={`mailto:${email}`} style={{color:'#34d399'}}>{email}</a></p>
        <p><strong>Website:</strong> <a href={`https://${domain}`} style={{color:'#34d399'}}>{domain}</a></p>
      </Section>
    </LegalPage>
  );
}

function LegalPage({ title, updated, children }) {
  return (
    <div style={{minHeight:'100vh',background:'#020817',color:'#f1f5f9',fontFamily:'Inter,sans-serif'}}>
      <div style={{position:'fixed',inset:0,background:'linear-gradient(to bottom,#020817,#0f172a,#020817)',pointerEvents:'none'}}/>
      <div style={{position:'relative',zIndex:1,maxWidth:860,margin:'0 auto',padding:'48px 32px 80px'}}>
        {/* Header */}
        <div style={{marginBottom:48}}>
          <a href="/" style={{display:'inline-flex',alignItems:'center',gap:10,textDecoration:'none',marginBottom:40}}>
            <div style={{width:36,height:36,borderRadius:10,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>✓</div>
            <span style={{fontSize:17,fontWeight:600,color:'#f1f5f9',letterSpacing:'-0.02em'}}>AutoGrade<span style={{color:'#475569',fontWeight:400}}>.ai</span></span>
          </a>
          <h1 style={{fontSize:'clamp(28px,4vw,44px)',fontWeight:600,letterSpacing:'-0.02em',marginBottom:12}}>{title}</h1>
          <p style={{fontSize:13,color:'#475569'}}>Last updated: {updated}</p>
        </div>
        {/* Content */}
        <div style={{display:'flex',flexDirection:'column',gap:32}}>
          {children}
        </div>
        {/* Footer */}
        <div style={{marginTop:64,paddingTop:24,borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',gap:24,flexWrap:'wrap'}}>
          <a href="/" style={{color:'#475569',fontSize:13,textDecoration:'none'}}>← Back to AutoGrade.ai</a>
          <a href="/privacy" style={{color:'#475569',fontSize:13,textDecoration:'none'}}>Privacy Policy</a>
          <a href="/terms" style={{color:'#475569',fontSize:13,textDecoration:'none'}}>Terms of Service</a>
        </div>
      </div>
      <style>{`
        p { color:#94a3b8; font-size:14px; line-height:1.8; margin-bottom:12px; }
        ul { color:#94a3b8; font-size:14px; line-height:1.8; padding-left:20px; margin-bottom:12px; }
        ul li { margin-bottom:4px; }
        strong { color:#f1f5f9; }
      `}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 style={{fontSize:18,fontWeight:600,color:'#f1f5f9',marginBottom:14,letterSpacing:'-0.01em'}}>{title}</h2>
      <div style={{paddingLeft:0}}>{children}</div>
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div style={{marginBottom:16}}>
      <h3 style={{fontSize:14,fontWeight:600,color:'#94a3b8',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>{title}</h3>
      {children}
    </div>
  );
}
