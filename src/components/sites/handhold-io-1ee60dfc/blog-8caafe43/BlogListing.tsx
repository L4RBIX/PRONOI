"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoMarkIcon } from "@/components/sites/handhold-io-1ee60dfc/shared/icons";
import { BlogCard } from "./BlogCard";
import type { BlogPost } from "./posts";

const CATEGORIES = ["All", "Customer Stories", "Growth"] as const;

export function BlogListing({ posts }: { posts: BlogPost[] }) {
  const [activeCategory, setActiveCategory] =
    useState<(typeof CATEGORIES)[number]>("All");

  const filtered =
    activeCategory === "All"
      ? posts
      : posts.filter((post) => post.category === activeCategory);

  const [featured, ...rest] = filtered;

  return (
    <>
      <h1 className="font-heading font-extralight text-6xl mb-8">Writing</h1>

      <div className="flex gap-2 mb-10">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={
              category === activeCategory
                ? "bg-gray-800 text-white rounded-full px-4 py-2 text-sm"
                : "bg-gray-100 text-gray-700 rounded-full px-4 py-2 text-sm hover:bg-gray-200"
            }
          >
            {category}
          </button>
        ))}
      </div>

      {featured ? (
        <div className="grid md:grid-cols-2 gap-8 border-b pb-10 mb-10">
          <Link
            href={`/blog/${featured.slug}`}
            className="bg-gray-100 rounded-lg flex items-center justify-center min-h-[240px]"
            aria-hidden="true"
            tabIndex={-1}
          >
            <LogoMarkIcon className="h-10 w-auto text-gray-300" />
          </Link>
          <Link href={`/blog/${featured.slug}`} className="block">
            <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600">
              {featured.category}
            </span>
            <p className="text-xs text-gray-400 mt-2">{featured.date}</p>
            <h2 className="font-heading text-3xl mt-1">{featured.title}</h2>
            <p className="text-gray-500 text-sm mt-3">{featured.excerpt}</p>
          </Link>
        </div>
      ) : (
        <p className="text-gray-500 text-sm border-b pb-10 mb-10">
          No posts in this category yet.
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {rest.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </>
  );
}
