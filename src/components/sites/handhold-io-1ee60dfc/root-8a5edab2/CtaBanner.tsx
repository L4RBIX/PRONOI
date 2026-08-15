import Image from "next/image";
import Link from "next/link";

export function CtaBanner() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden text-center">
      <Image
        src="/sites/handhold-io-1ee60dfc/root-8a5edab2/hand-top-left.webp"
        alt=""
        width={384}
        height={384}
        className="absolute top-0 left-0 w-64 md:w-96 h-auto opacity-90 object-contain pointer-events-none select-none"
        aria-hidden="true"
      />
      <Image
        src="/sites/handhold-io-1ee60dfc/root-8a5edab2/hand-bottom-right.webp"
        alt=""
        width={384}
        height={384}
        className="absolute bottom-0 right-0 w-64 md:w-96 h-auto opacity-90 object-contain pointer-events-none select-none"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <h2 className="font-heading font-extralight text-3xl md:text-4xl max-w-2xl mx-auto">
          Stop finding out about stockouts from an empty shelf
        </h2>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black/85"
        >
          Open the dashboard
        </Link>
      </div>
    </section>
  );
}
