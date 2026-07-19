import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/lib/cms-posts";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog — Salsa Burgers Bangkok | Wagyu, Sauces & Guides",
  description:
    "Articles about Wagyu burgers, artisan sauces and delivery guides in Bangkok. Everything you need to know about Salsa Burgers.",
  alternates: { canonical: "/blog" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="bg-[#0a0a0a] min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="relative pt-32 pb-16 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff0000]/8 via-black to-black" />
        <div className="relative z-10 max-w-[1100px] mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/30 rounded-full inline-block mb-6">
            The Salsa Blog
          </span>
          <h1
            className="font-black text-white uppercase tracking-tighter leading-none mb-4"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
          >
            BURGER{" "}
            <span style={{ color: "#ff0000" }}>KNOWLEDGE</span>
          </h1>
          <p className="text-white/50 text-lg font-medium max-w-xl mx-auto">
            Wagyu, artisan sauces and everything you need to know to dip better.
          </p>
        </div>
      </section>

      {/* Posts grid */}
      <section className="max-w-[1100px] mx-auto px-6 sm:px-8 lg:px-12 py-16 pb-24">
        {posts.length === 0 ? (
          <p className="text-white/40 text-center py-20">Coming soon…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0f0f0f] transition-all duration-300 hover:border-[#ff0000]/50 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(255,0,0,0.15)]"
              >
                {/* Category chip */}
                <div className="px-6 pt-6 pb-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff0000] border border-[#ff0000]/30 px-3 py-1 rounded-full bg-[#ff0000]/8">
                    {post.category || "Blog"}
                  </span>
                </div>

                <div className="p-6">
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-tight mb-3 group-hover:text-[#ff0000] transition-colors duration-200">
                    {post.title}
                  </h2>
                  <p className="text-white/50 text-sm leading-relaxed line-clamp-3 mb-6">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/8">
                    <div>
                      <p className="text-white/30 text-xs font-medium">
                        {post.author_name}
                      </p>
                      <p className="text-white/20 text-xs">
                        {post.published_at ? formatDate(post.published_at) : ""}
                      </p>
                    </div>
                    <span className="text-[#ff0000] text-sm font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform duration-200">
                      Read →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
