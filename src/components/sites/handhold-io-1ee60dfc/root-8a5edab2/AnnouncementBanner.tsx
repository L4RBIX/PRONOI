export function AnnouncementBanner() {
  return (
    <div className="w-full bg-cream py-2.5 text-center text-sm text-cream-foreground">
      This is a hackathon MVP. Every risk score, quantity, and cost you see is computed live from demo data.{" "}
      <a href="#decision-lab" className="font-medium underline underline-offset-2">
        Try the Decision Lab
      </a>
    </div>
  );
}
