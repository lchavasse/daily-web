import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import NavigationMenu from '@/components/NavigationMenu';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 relative">
      {/* Content Card */}
      <div className="daily-card animate-fade-in mb-16 mx-auto max-w-4xl">
        {/* Header with back button and logo */}
        <div className="relative flex items-center justify-center mb-12 lm">
          <button
            onClick={() => navigate('/about')}
            className="absolute left-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
          
          <Logo />
        </div>

        <div className="prose prose-invert max-w-none space-y-6 mx-4">
          <h1 className="text-4xl font-bold">Privacy Policy for daily.</h1>
          
          <p className="text-lg leading-relaxed">
            We at daily. (Nile Street Ltd) value your privacy and are committed to protecting your personal data. In handling your most private personal thoughts we take a maximalist approach to privacy. Your journal entries within the app are securely encrypted by default (with your device specific key), and only by opting in to our additional features will that ever not be the case. Whilst they are in beta, we are necessarily forgoing some of our usual privacy measures to expand functionality.
          </p>

          <p className="text-lg leading-relaxed">
            This Privacy Policy explains how we collect, use, and protect your information in compliance with the UK General Data Protection Regulation (UK GDPR) and the EU General Data Protection Regulation (EU GDPR).
          </p>

          <h2 className="text-3xl font-semibold mt-10">1. Data We Collect</h2>

          <h3 className="text-2xl font-medium mt-8">a) Personal Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Email Address</strong>: Used for account authentication and communication related to your account. Securely stored and connected to your unique user ID.</li>
            <li><strong>Phone Number</strong>: Required to enable phone calls with the voice assistant. Associated with your user ID for authentication.</li>
            <li><strong>Name</strong>: May be collected for personalized service through the voice assistant.</li>
          </ul>

          <h3 className="text-2xl font-medium mt-8">b) User Content</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Journal Entries (App)</strong>: Your in-app journal entries are encrypted on your device using a unique key, ensuring they cannot be accessed without the device or key.</li>
            <li><strong>Profile Information</strong>: Your profile details, tasks, projects, and reminders are stored and encrypted using industry-standard security (AES-256).</li>
            <li><strong>Voice Assistant Interactions</strong>: Conversations with the AI voice assistant are processed but not permanently stored.</li>
          </ul>

          <h3 className="text-2xl font-medium mt-8">c) Voice Data</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Purpose</strong>: Voice data is sent to our partners (Deepgram, OpenAI, and/or others) for transcription and processing when you use the voice assistant or speech-to-text features.</li>
            <li><strong>Retention</strong>: Voice data is not stored or saved by us or our partners after processing, except as necessary for the immediate functioning of the service.</li>
          </ul>

          <h3 className="text-2xl font-medium mt-8">d) Anonymous Usage Data</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Purpose</strong>: We collect anonymized data to improve app functionality and user experience, such as feature usage patterns and app performance metrics.</li>
            <li><strong>Retention</strong>: This data is not linked to your identity and is stored securely for analysis.</li>
          </ul>

          <h3 className="text-2xl font-medium mt-8">e) Additional Data You Share</h3>
          <p className="text-lg leading-relaxed">
            If you contact us through email or other communication methods, we may collect and store the data you choose to share (e.g., feedback, support requests). This data will be used solely for addressing your inquiries and improving our services.
          </p>

          <h2 className="text-3xl font-semibold mt-10">2. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and enhance the features of Daily, including the voice assistant.</li>
            <li>To authenticate and secure your account.</li>
            <li>To deliver AI services and transcriptions for the voice assistant and other features.</li>
            <li>To improve functionality and user experience using anonymous usage data.</li>
            <li>To respond to your communications and feedback.</li>
          </ul>

          <h2 className="text-3xl font-semibold mt-10">3. Legal Basis for Processing</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Consent</strong>: When you enable optional AI services, use voice features, or share data with us voluntarily.</li>
            <li><strong>Contract</strong>: To provide core functionalities of Daily (e.g., authentication and storage of journal entries, tasks, and reminders).</li>
            <li><strong>Legitimate Interests</strong>: To improve our app and user experience, where such interests are not overridden by your rights.</li>
          </ul>

          <h2 className="text-3xl font-semibold mt-10">4. Data Sharing</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>AI Services</strong>: Journal entries (when decrypted), voice data, and user interactions are shared with our partners (including Deepgram, OpenAI, Anthropic, ElevenLabs, and Cartesia) solely for processing. This is essential for the functioning of the voice assistant and other AI features. Data is not retained by these partners after processing except as necessary for immediate service delivery.</li>
            <li><strong>Anonymous Usage Data</strong>: Aggregated and anonymized usage data may be shared with analytics tools to improve app functionality. This data cannot be used to identify you.</li>
          </ul>

          <h2 className="text-3xl font-semibold mt-10">5. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information</strong>: We retain your data for as long as you have an active account or as required to comply with legal obligations.</li>
            <li><strong>Voice Assistant Data</strong>: Data processed for voice assistant features is not retained after use, except as necessary for the immediate functioning of the service.</li>
            <li><strong>Profile and User Content</strong>: Your profile information, tasks, projects, and reminders are stored indefinitely as they are essential to the product functionality. You can request deletion at any time.</li>
            <li><strong>Anonymous Usage Data</strong>: May be retained for analytical purposes but cannot be linked to you.</li>
          </ul>

          <h2 className="text-3xl font-semibold mt-10">6. Your Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access</strong>: Request a copy of the personal data we hold about you.</li>
            <li><strong>Rectification</strong>: Request corrections to any inaccuracies in your personal data.</li>
            <li><strong>Erasure</strong>: Request deletion of your data at any time by contacting us at <a href="mailto:daily@nile-street.com" className="text-daily-button hover:underline">daily@nile-street.com</a>.</li>
            <li><strong>Data Portability</strong>: Request to transfer your data to another service.</li>
            <li><strong>Restriction of Processing</strong>: Request to limit how your data is processed.</li>
            <li><strong>Objection</strong>: Object to processing based on legitimate interests.</li>
          </ul>

          <h2 className="text-3xl font-semibold mt-10">7. Data Security</h2>
          <p className="text-lg leading-relaxed">We use encryption and other security measures to protect your data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Journal entries in the app are encrypted on your device by default.</li>
            <li>Profile information, tasks, projects, and reminders are secured with industry-standard encryption (AES-256).</li>
            <li>Data sent to third-party partners for AI or voice features is transmitted securely and is not retained after processing.</li>
            <li>Anonymous usage data is aggregated and stored securely.</li>
          </ul>

          <h2 className="text-3xl font-semibold mt-10">8. Contact Us</h2>
          <p className="text-lg leading-relaxed">
            If you have any questions or concerns about this Privacy Policy or how your data is handled, please contact us at:
          </p>
          <p className="text-lg leading-relaxed">
            Email: <a href="mailto:daily@nile-street.com" className="text-daily-button hover:underline">daily@nile-street.com</a>
          </p>

          <h3 className="text-2xl font-medium mt-8">8.1 Account Deletion</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>For app journal entries: Overwriting with a blank entry will remove it from our database.</li>
            <li>For complete account deletion: Please contact us to confirm deletion of your user profile, tasks, projects, reminders, and all associated data from the system.</li>
          </ul>

          <h2 className="text-3xl font-semibold mt-10">9. Changes to This Privacy Policy</h2>
          <p className="text-lg leading-relaxed">
            We may update this Privacy Policy from time to time. Significant changes will be communicated to you via email or app notifications.
          </p>

          <p className="text-lg leading-relaxed mt-8">
            By using daily, you agree to this Privacy Policy.
          </p>
        </div>
      </div>

      <NavigationMenu />
    </div>
  );
};

export default PrivacyPolicy;
