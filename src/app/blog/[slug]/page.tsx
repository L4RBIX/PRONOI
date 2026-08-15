import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogHeader } from "@/components/sites/handhold-io-1ee60dfc/blog-8caafe43/BlogHeader";
import { BlogFooter } from "@/components/sites/handhold-io-1ee60dfc/blog-8caafe43/BlogFooter";
import { BlogBody } from "@/components/sites/handhold-io-1ee60dfc/blog-8caafe43/BlogBody";
import { posts } from "@/components/sites/handhold-io-1ee60dfc/blog-8caafe43/posts";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((candidate) => candidate.slug === slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} | Handhold`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = posts.find((candidate) => candidate.slug === slug);

  if (!post) {
    notFound();
  }

  const byline = `${post.author ? `${post.author} · ` : ""}${post.date}`;

  return (
    <div className="min-h-full flex flex-col bg-background">
      <BlogHeader />
      <main className="max-w-2xl mx-auto px-6 py-16 w-full">
        <Link href="/blog" className="text-sm text-gray-500 mb-8 block">
          ← Back
        </Link>

        <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs mb-4">
          {post.category}
        </span>
        <h1 className="font-heading font-extralight text-4xl mb-3">
          {post.title}
        </h1>
        <p className="text-sm text-gray-500 mb-10">{byline}</p>

        {post.body ? (
          <BlogBody sections={post.body} />
        ) : (
          <p className="text-gray-700 leading-relaxed mb-5">
            {post.excerpt}
          </p>
        )}
      </main>
      <BlogFooter />
    </div>
  );
}
