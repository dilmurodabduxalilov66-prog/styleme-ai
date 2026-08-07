import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
      <p className="mb-4">
        StyleMe AI collects and processes the following data to provide our virtual try-on and booking services:
      </p>
      <ul className="list-disc pl-6 mb-4 space-y-2">
        <li><strong>Face Images & Photos:</strong> When you use our Virtual Try-On AI feature, you upload images of your face. These images are processed securely using our AI engine (Replicate API) to detect your face shape and generate personalized hairstyles.</li>
        <li><strong>Personal Information:</strong> Phone numbers (for OTP authentication), names, and appointment details.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Data</h2>
      <p className="mb-4">
        We use your images <strong>strictly</strong> for the purpose of generating the AI hairstyle preview. We do not use your facial data to train our AI models, nor do we sell this data to third parties. Uploaded images are temporarily stored in secure Cloudflare R2 storage and deleted shortly after processing.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Security & Retention</h2>
      <p className="mb-4">
        Your data is encrypted in transit and at rest. If you wish to delete your account or any uploaded photos, you can do so through the app settings or by contacting our support team.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Contact Us</h2>
      <p className="mb-4">
        If you have any questions about this Privacy Policy, please contact us at privacy@styleme.uz.
      </p>
    </div>
  );
}
