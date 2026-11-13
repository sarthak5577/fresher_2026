import { Suspense } from 'react';
import Navbar from '@/components/public/Navbar';
import HeroSection from '@/components/public/HeroSection';
import AboutSection from '@/components/public/AboutSection';
import InstructionsSection from '@/components/public/InstructionsSection';
import FAQSection from '@/components/public/FAQSection';
import Footer from '@/components/public/Footer';
import RegistrationForm from '@/components/registration/RegistrationForm';
import { getEventSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const settings = await getEventSettings();

  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection registrationOpen={settings.registration_open ?? true} />
      <AboutSection />
      <InstructionsSection />
      <Suspense>
        <RegistrationForm settings={settings} />
      </Suspense>
      <FAQSection />
      <Footer settings={settings} />
    </main>
  );
}
