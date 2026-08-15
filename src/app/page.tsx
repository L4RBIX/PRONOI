import { AnnouncementBanner } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/AnnouncementBanner";
import { SiteHeader } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/SiteHeader";
import { Hero } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/Hero";
import { StatsBar } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/StatsBar";
import { AiDemoTeaser } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/AiDemoTeaser";
import { AgentShowcase } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/AgentShowcase";
import { GetStarted } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/GetStarted";
import { CreateAgentSection } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/CreateAgentSection";
import { TestimonialCarousel } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/TestimonialCarousel";
import { FaqAccordion } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/FaqAccordion";
import { CtaBanner } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/CtaBanner";
import { SiteFooter } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/SiteFooter";
import { FloatingChatWidget } from "@/components/sites/handhold-io-1ee60dfc/root-8a5edab2/FloatingChatWidget";

export default function Home() {
  return (
    <div className="min-w-0">
      <AnnouncementBanner />
      <SiteHeader />
      <Hero />
      <StatsBar />
      <AiDemoTeaser />
      <AgentShowcase />
      <GetStarted />
      <div className="mx-auto min-w-0 max-w-[94.5rem] px-4 lg:px-8">
        <CreateAgentSection />
        <TestimonialCarousel />
        <FaqAccordion />
      </div>
      <CtaBanner />
      <div className="mx-auto min-w-0 max-w-[94.5rem] px-4 lg:px-8">
        <SiteFooter />
      </div>
      <FloatingChatWidget />
    </div>
  );
}
