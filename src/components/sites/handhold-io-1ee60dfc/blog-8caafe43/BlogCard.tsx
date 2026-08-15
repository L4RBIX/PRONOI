import Link from "next/link";
import type { BlogPost } from "./posts";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600">
        {post.category}
      </span>
      <p className="text-xs text-gray-400 mt-2">{post.date}</p>
      <h3 className="font-heading text-2xl mt-1 group-hover:text-gray-600 transition-colors">
        {post.title}
      </h3>
      <p className="text-gray-500 text-sm mt-2">{post.excerpt}</p>
    </Link>
  );
}
