import type { Metadata } from "next";
import { BlogHeader } from "@/components/sites/handhold-io-1ee60dfc/blog-8caafe43/BlogHeader";
import { BlogFooter } from "@/components/sites/handhold-io-1ee60dfc/blog-8caafe43/BlogFooter";
import { BlogListing } from "@/components/sites/handhold-io-1ee60dfc/blog-8caafe43/BlogListing";
import { posts } from "@/components/sites/handhold-io-1ee60dfc/blog-8caafe43/posts";

export const metadata: Metadata = {
  title: "Writing | Handhold",
  description: "Stories, guides, and updates from the Handhold team.",
};

export default function BlogPage() {
  return (
    <div className="min-h-full flex flex-col bg-background">
      <BlogHeader />
      <main className="max-w-5xl mx-auto px-6 py-16 w-full">
        <BlogListing posts={posts} />
      </main>
      <BlogFooter />
    </div>
  );
}
